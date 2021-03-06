import calendar, locale, threading

from contextlib import contextmanager
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from ttapp.models import Attendance, CancelledTrainings, TrainingSchedule, Groups, MonthlyBalance, Payment


def get_trainings_in_month(year, month, group=None):
    trainings = []

    iterdate = date(year, month, 1)
    while (iterdate.month == month):
        schedules = TrainingSchedule.objects.filter(
            # for some reason there isn't a __le or __ge for dates
            Q(start_date=iterdate) | Q(start_date__lt=iterdate),
            Q(stop_date__isnull=True) | Q(stop_date=iterdate) | Q(stop_date__gt=iterdate)
        ).order_by("dow", "begin_time").all()

        for s in schedules:
            # should there be a training on this day?
            if iterdate.weekday() == s.dow:
                # if this training was cancelled on that date, skip it
                if CancelledTrainings.objects.filter(schedule=s, date=iterdate).count() > 0:
                    continue

                # optional group filtering
                if group is None or group == s.group:
                    trainings.append({
                        "group": s.group,
                        "training": s,
                        "date": datetime( iterdate.year, iterdate.month, iterdate.day, s.begin_time.hour, s.begin_time.minute )
                    })
        # add days until we reach next month
        iterdate += timedelta(1)

    return sorted(trainings, key=lambda s: s["date"])


def calculate_attendance_summary(attendees, year=None, month=None, split_by_month=False, month_range=6):
    output = {}
    attendees_summary = {}
    group_training_days = {}
    months = []
    if year is not None and month is not None:
        months.append(date(year, month, 1))
    else:
        # use last 6 months, including current month
        t = date.today()
        iter_month = date(t.year, t.month, 1)
        for _ in range(month_range):
            months.append(iter_month)
            iter_month -= relativedelta(months = 1)

    groups = Groups.objects.all()

    monthStr = {}
    for month in months:
        with setlocale('pl_PL.UTF-8'):
            monthStr[month] = month.strftime("%B %Y").capitalize()

    for a in attendees:
        aKey = str(a.pk)
        if a not in attendees_summary:
            attendees_summary[aKey] = {}

        for month in months:
            if month not in attendees_summary[aKey]:
                attendees_summary[aKey][month] = { "basic": { "count": 0, "total": 0 }, "extra": { "count": 0, "total": 0 } }
            if month not in group_training_days:
                group_training_days[month] = {
                    "all": []
                }
                for t in get_trainings_in_month(month.year, month.month):
                    if t["date"] <= datetime.today():
                        group_training_days[month]["all"].append(t)

            common = {
                "attendee": a,
                "date__startswith": "%04d-%02d-" % (month.year, month.month)
            }
            for g in groups:
                unscheduled = 0
                if a.group == g:
                    total = 0
                    for t in group_training_days[month]["all"]:
                        if t["group"] is None or t["group"] == g:
                            total += 1
                    attendees_summary[aKey][month]["basic"]["count"] += Attendance.objects.filter(
                        # include "mixed" groups in basic attendance
                        Q(training__isnull=False),
                        Q(training__group__isnull = True) | Q(training__group=g),
                        **common
                    ).count()
                    attendees_summary[aKey][month]["basic"]["total"] += total
                else:
                    total = 0
                    for t in group_training_days[month]["all"]:
                        if t["group"] == g:
                            total += 1
                    scheduled   = Attendance.objects.filter(Q(training__group=g), **common).count()
                    unscheduled = Attendance.objects.filter(Q(training__isnull=True), **common).count()
                    attendees_summary[aKey][month]["extra"]["count"] += scheduled + unscheduled
                    attendees_summary[aKey][month]["extra"]["total"] += total + unscheduled

        if aKey not in output:
            output[aKey] = {}
        for month in months:
            for atType in attendees_summary[aKey][month]:
                if split_by_month:
                    if month not in output[aKey]:
                        output[aKey][month] = {}

                    count = attendees_summary[aKey][month][atType]["count"]
                    total = attendees_summary[aKey][month][atType]["total"] or 0
                    freq = 0
                    if total > 0:
                        freq = "%d" % (100 * count / total)

                    output[aKey][month][atType] = {
                        "freq": freq,
                        "count": count,
                    }
                else:
                    if atType not in output[aKey]:
                        output[aKey][atType] = {"count": 0, "total": 0}
                    output[aKey][atType]["count"] += attendees_summary[aKey][month][atType]["count"]
                    output[aKey][atType]["total"] += attendees_summary[aKey][month][atType]["total"]

        if split_by_month:
            # adjust the output format so it's easier to traverse in JavaScript
            tmp = []
            for month in output[aKey]:
                row = {
                    "month": monthStr[month],
                    "raw_month": "%04d-%02d" % (month.year, month.month)
                }
                for atType in output[aKey][month]:
                    row[atType] = output[aKey][month][atType]
                tmp.append(row)
 
            output[aKey] = sorted(tmp, key=lambda r: r["raw_month"])
        else:
            for atType in output[aKey]:
                total = output[aKey][atType].pop("total", 0)
                if total > 0:
                    output[aKey][atType]["freq"] = "%d" % (100 * output[aKey][atType]["count"] / total)

    return output

LOCALE_LOCK = threading.Lock()

@contextmanager
def setlocale(name):
    with LOCALE_LOCK:
        saved = locale.setlocale(locale.LC_ALL)
        try:
            yield locale.setlocale(locale.LC_ALL, name)
        finally:
            locale.setlocale(locale.LC_ALL, saved)


'''
Two types of payment based on Attendees has_sport_card attribute
If has_sport_card == true than attendance-based payment
If has_sport_card == false than monthly payment
'''
class PaymentUtil:

    money_from_sport_card = 10   # 10zl
    opt_warning_issued = False

    '''
    Utility method for getting attendee month payment
    '''
    def get_monthly_payment(self, year, month, attendee):
        if attendee.has_sport_card:
            return self.monthly_payment_based_on_attendance(year, month, attendee)
        # Logic for calculate monthly payment
        return attendee.get_monthly_fee()

    def monthly_payment_based_on_attendance(self, year, month, attendee):
        attendance_count = Attendance.objects.filter(
            attendee=attendee,
            date__startswith="%04d-%02d" % (year, month)
        ).count()
        return attendee.get_monthly_fee() - (attendance_count * self.money_from_sport_card)

    @staticmethod
    def last_day_of_month(month):
        return calendar.monthrange(datetime.now().year, month)[1]

    '''
    Utility method for getting total current balance
    '''
    def get_total_current_balance(self, attendee):
        attendances = None
        payments = None
        attendances_map = {}
        total_balance = 0
        t = date.today()

        monthly_balance_set = MonthlyBalance.objects.filter(attendee=attendee).order_by('-year', '-month')
        if monthly_balance_set.exists():
            total_balance = monthly_balance_set[0].amount
            next_month = date(monthly_balance_set[0].year, monthly_balance_set[0].month, 1) + relativedelta(months=1)
            attendances = Attendance.objects.filter(attendee=attendee, date__gte=next_month).order_by('-date')
            payments = Payment.objects.filter(attendee=attendee, date__gte=next_month)
        else:
            # take all payments and all attendances
            attendances = Attendance.objects.filter(attendee=attendee).order_by('-date')
            payments = Payment.objects.filter(attendee=attendee)
            # take first month of attendance
            first_att = attendances[len(attendances) - 1].date
            next_month = date(first_att.year, first_att.month, 1)

        for record in attendances:
            if record.date.year in attendances_map:
                if record.date.month in attendances_map[record.date.year]:
                    attendances_map[record.date.year][record.date.month] += 1
                else:
                    attendances_map[record.date.year][record.date.month] = 1
            else:
                attendances_map[record.date.year] = {record.date.month: 1}

        # prepare a list of months to take into account
        months = []
        iter_month = next_month
        while (t.year * 12 + t.month >= iter_month.year * 12 + iter_month.month):
            months.append(iter_month)
            iter_month += relativedelta(months = 1)
            if not self.opt_warning_issued and len(months) > 6:
                self.opt_warning_issued = True
                print("Warning, payment balance calculation is done for more than 6 months for " + str(attendee))

        for m in months:
            is_current_month = (t.year == m.year and t.month == m.month)
            # subtract the monthly fee for the current month for those without a sport card
            if is_current_month and not attendee.has_sport_card:
                total_balance -= attendee.get_monthly_fee()

            # skip months without at least one attendance
            if m.year not in attendances_map or m.month not in attendances_map[m.year]:
                continue

            # subtract the monthly fee
            if not is_current_month:
                total_balance -= attendee.get_monthly_fee()

                # now if the attendee is using a sports card, add the correct amount for every attendance
                if attendee.has_sport_card:
                    total_balance += (attendances_map[m.year][m.month] * self.money_from_sport_card)

        # finally append any payments already registered
        for p in payments:
            total_balance += p.amount

        return total_balance
