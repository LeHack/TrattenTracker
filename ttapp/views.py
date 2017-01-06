from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from ttapp.models import Groups, TrainingMonth, TrainingSchedule, Attendance, Attendees, Payment, MonthlyBalance


def list_groups(request):
    groups = []
    for g in Groups.objects.all():
        groups.append({
            "group_id": g.pk,
            "name": g.name,
            "fee": g.monthly_fee
        })
    return JsonResponse({"groups": groups})


def list_attendees(request):
    attendees = []
    for a in Attendees.objects.all():
        attendees.append({
            "attendee_id": a.pk,
            "group_id": a.group.pk,
            "name": "%s %s" % (a.first_name, a.last_name),
            "sport_card": a.has_sport_card,
        })
    return JsonResponse({"attendees": attendees})


def list_schedules(request):
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


def get_training_days_count(request, group_id, year, month):
    day_count = None
    try:
        custom = TrainingMonth.objects.get(
            group=get_object_or_404(Groups, pk=group_id),
            year=year,
            month=month
        )
        day_count = custom.day_count
    except TrainingMonth.DoesNotExist:
        # TODO: calculate the training days using TrainingSchedule and selected month
        day_count = 42

    return JsonResponse({"count": day_count})


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
