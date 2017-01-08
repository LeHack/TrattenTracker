from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ttapp.models import Groups, TrainingSchedule, Attendance, Attendees, Payment, MonthlyBalance
from ttapp.utils import get_trainings_in_month


def list_groups(request):
    groups = []
    for g in Groups.objects.all():
        groups.append({
            "group_id": g.pk,
            "name": g.name,
            "fee": g.monthly_fee
        })

    # TODO: here we should use some external method to calculate the "next" group,
    # read issue#10 for a detailed description regarding selecting the default group
    selected_group = groups[0]["group_id"]

    return JsonResponse({"groups": groups, "selected": selected_group})


def list_attendees(request, group_id=None):
    query = Attendees.objects
    if group_id is not None:
        query = query.filter(group=get_object_or_404(Groups, pk=group_id))

    data = []
    for a in query.all():
        data.append({
            "attendee_id": a.pk,
            "group_id": a.group.pk,
            "name": "%s %s" % (a.first_name, a.last_name),
            "sport_card": a.has_sport_card,
        })
    return JsonResponse({"attendees": data})


def list_trainings(request, year=None, month=None):
    ''' List all trainings from all groups for the given month and automatically select the closest one (see issue#10) '''
    schedules = []
    for ts in TrainingSchedule.objects.all():
        schedules.append({
            "trainingschedule_id": ts.pk,
            "group_id": ts.group.pk,
            "day_of_week": ts.dow,
            "begin": ts.begin_time.strftime('%H:%M'),
            "end": ts.end_time.strftime('%H:%M'),
            "sport_card": ts.sport_card_allowed,
        })
    return JsonResponse({"schedules": schedules})


def list_attendance(request, attendee_id, year=None, month=None):
    stWith = []
    if year is not None:
        stWith.append(str(year))
    if month is not None:
        stWith.append(str(month))
    params = {}
    if len(stWith) > 0:
        params["date__startswith"] = "-".join(stWith)

    data = Attendance.objects.filter(
        attendee=get_object_or_404(Attendees, pk=attendee_id),
        **params
    ).all()
    attendance = []
    for a in data:
        attendance.append({
            "date": a.get_training_date(),
            "group_id": a.get_training_group_id(),
            "sport_card": a.used_sport_card,
        })
    return JsonResponse({"attendance": attendance})


def attendance_summary(request, attendee_id=None, group_id=None, year=None, month=None):
    ''' Calculates the attendance statistics for the given attendee or group '''
    default_month_range = 2 # 2 for testing, later switch to 6
    attendees_summary = {}
    attendees = []
    if group_id is not None:
        attendees = Attendees.objects.filter(group=get_object_or_404(Groups, pk=group_id)).all()
    elif attendee_id is not None:
        attendees.append(get_object_or_404(Attendees, pk=attendee_id))

    group_training_days = {}
    months = []
    if year is not None and month is not None:
        months.append(date(year, month, 1))
    else:
        # use last 6 months, including current month
        t = date.today()
        iter_month = date(t.year, t.month, 1)
        for _ in range(default_month_range):
            months.append(iter_month)
            iter_month -= relativedelta(months = 1)

    groups = Groups.objects.all()

    for a in attendees:
        aKey = str(a.pk)
        if a not in attendees_summary:
            attendees_summary[aKey] = { "basic": { "count": 0, "total": 0 }, "extra": { "count": 0, "total": 0 } }

        for month in months:
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
                    attendees_summary[aKey]["basic"]["count"] += Attendance.objects.filter(
                        # include "mixed" groups in basic attendance
                        Q(training__isnull=False),
                        Q(training__group__isnull = True) | Q(training__group=g),
                        **common
                    ).count()
                    attendees_summary[aKey]["basic"]["total"] += total
                else:
                    total = 0
                    for t in group_training_days[month]["all"]:
                        if t["group"] == g:
                            total += 1
                    scheduled   = Attendance.objects.filter(Q(training__group=g), **common).count()
                    unscheduled = Attendance.objects.filter(Q(training__isnull=True), **common).count()
                    attendees_summary[aKey]["extra"]["count"] += scheduled + unscheduled
                    attendees_summary[aKey]["extra"]["total"] += total + unscheduled

        for atType in attendees_summary[aKey]:
            total = attendees_summary[aKey][atType].pop("total", 0)
            if total > 0:
                attendees_summary[aKey][atType]["freq"] = "%d" % (100 * attendees_summary[aKey][atType]["count"] / total)

    return JsonResponse({"stats": attendees_summary})


def list_payments(request, attendee_id, year):
    data = Payment.objects.filter(
        attendee=get_object_or_404(Attendees, pk=attendee_id),
        date__startswith=str(year)
    ).all()
    payments = []
    for p in data:
        payments.append({
            "date": p.date.strftime('%Y-%m-%d %H:%M'),
            "type": p.get_type_display(),
            "amount": p.amount,
            "tax_reported": p.tax_reported,
        })
    return JsonResponse({"payments": payments})


def get_last_balance(request, attendee_id):
    balance = MonthlyBalance.objects.filter(
        attendee=get_object_or_404(Attendees, pk=attendee_id),
    ).order_by('year', 'month').last()
    return JsonResponse({
        "amount": balance.amount,
        "date": "%s-%s" % (str(balance.year), str(balance.month))
    })

# TODO: Implement session handling and make this dynamic
def get_session_status(request):
    session = {
        "status": "LoggedIn",
        "user": "LeHack",
        "mode": "admin"
    }
    return JsonResponse(session)
