import locale, threading

from contextlib import contextmanager
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from ttapp.models import Attendance, CancelledTrainings, TrainingSchedule, Groups


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
            with setlocale('pl_PL.UTF-8'):
                monthStr = month.strftime("%B %Y").capitalize()
            for atType in attendees_summary[aKey][month]:
                if split_by_month:
                    if monthStr not in output[aKey]:
                        output[aKey][monthStr] = {}

                    count = attendees_summary[aKey][month][atType]["count"]
                    total = attendees_summary[aKey][month][atType]["total"] or 0
                    freq = 0
                    if total > 0:
                        freq = "%d" % (100 * count / total)

                    output[aKey][monthStr][atType] = {
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
            for monthStr in output[aKey]:
                row = { "month": monthStr }
                for atType in output[aKey][monthStr]:
                    row[atType] = output[aKey][monthStr][atType]
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
If true than attendance-based payment
If false than monthly payment
'''
def get_monthly_payment(attendees):
    if attendees.has_sport_card == True:
        return attendees.group.monthly_fee
