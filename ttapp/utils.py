import locale, threading

from contextlib import contextmanager
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from ttapp.models import Attendance, CancelledTrainings, TrainingSchedule, Groups, MonthlyBalance


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
                        output[aKey][atType] = { "count": 0, "total": 0 }
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

            output[aKey] = tmp
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
# todo: total current balance calculation
class PaymentUtil:
    money_from_sport_card = 10   # 10zl

    '''
    Utility method for getting attendee month payment
    '''
    def get_monthly_payment(self, year, month, attendee):
        if attendee.has_sport_card:
            return attendee.group.monthly_fee
        # Logic for calculate monthly payment
        return self.monthly_payment_based_on_attendance(year, month, attendee)

    def monthly_payment_based_on_attendance(self, year, month, attendee):
        start = date(year, month, 1)
        attendance_count = Attendance.objects.filter(attendee=attendee,
                                                     date__gte=start,
                                                     date__lte=self.last_day_of_month(month)).count()
        return attendee.group.monthly_fee - (attendance_count * self.money_from_sport_card)

    @staticmethod
    def last_day_of_month(month):
        time = datetime.now().replace(month=month)
        next_month = time.replace(day=28) + timedelta(days=4)  # this will never fail
        return next_month - timedelta(days=next_month.day)

    '''
    Utility method for getting total current balance

    the total current balance - to calculate this we take every month for which there is
    any attendance info available for that particular attendee,
    multiply the month count by the group fee and
    subtract the attendance count x10zł (this should be always calculated live, not stored anywhere)
    '''
    def get_total_current_balance(self, attendee):
        last_date_year = None
        last_date_month = None
        previous_amount = 0
        current_amount = 0;

        monthly_balance_set = MonthlyBalance.objects.filter(attendee=attendee).order_by('-year', '-month')
        monthly_balance = None
        # if monthly_balance_set.exists():
        #     monthly_balance = monthly_balance_set.reverse()[0]
        #     last_date_year = monthly_balance.year
        #     last_date_month = monthly_balance.month
        #     previous_amount = monthly_balance.amount

        # print(last_date_year)
        # print(last_date_month)
        # print(previous_amount)

        attendances = Attendance.objects.filter(attendee=attendee).order_by('-date')
        print(attendances)

        year = None
        month = None
        change = False
        for record in attendances:
            if record.date.year != year:
                year = record.date.year
                change = True
            else:
                change = False

            if record.date.month != month:
                month = record.date.month
                change = True
            else:
                change = False

            if change:
                current_amount += self.get_monthly_payment(year, month, attendee)

        print(current_amount)

        return current_amount










