import json
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone, dateparse
from ttapp.models import Groups, Attendance, Attendees, Payment, MonthlyBalance, TrainingSchedule
from ttapp.utils import get_trainings_in_month, calculate_attendance_summary


def list_groups(request):
    groups = []
    for g in Groups.objects.all():
        groups.append({
            "group_id": g.pk,
            "name": g.name,
            "fee": g.monthly_fee
        })

    # TODO: we need a group ordering method, which would order them using a predefined metric
    # so we can have advanced group first, medium second and beginner third, regardless of their db ids, name etc.
    groups = sorted(groups, key=lambda g: g["group_id"])
    groups.reverse()
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
    ''' List  all trainings from all groups for the given month and automatically select the closest one (see issue#10) '''
    trainings = []
    today = datetime.today()
    months = []
    if year is not None and month is not None:
        months.append( date(year, month, 1) )
    else:
        # by default show current and last month
        months.append( today - relativedelta(months=1) );
        months.append( today );

    tmpId = 1
    for month in months:
        for t in get_trainings_in_month(month.year, month.month):
            if t["date"] - timedelta(minutes = 20) <= today:
                t_date = t["date"].strftime("%Y-%m-%d");
                t_time = t["date"].strftime("%H:%M")
                training = {
                    # we need a custom id for these entries, this is used only in UI
                    "id": "training" + str(tmpId),
                    "training_id": t["training"].pk,
                    "date": t_date,
                    "time": t_time,
                    "name": "%s %s" % (t_date, t_time),
                }
                trainings.append(training)
                tmpId += 1
    trainings = sorted(trainings, key=lambda s: s["date"])
    # by default select the last one
    return JsonResponse({"trainings": trainings[-6:], "selected": trainings[-1]["id"]})


def list_attendance(request, date=None, time=None, month=None, attendee_id=None):
    if (date is None or time is None) and month is None:
        raise Exception("You need to specify date and time or year and month")

    params = {}
    if date is not None and time is not None:
        params = {
            "date__startswith": date,
            "training__begin_time": time,
        }
    else:
        params = {
            "date__startswith": month, # e.g. 2017-01
        }

    if attendee_id is not None:
        params["attendee_id"] = get_object_or_404(Attendees, pk=attendee_id)
    attendance = []
    for a in Attendance.objects.filter(**params).all():
        attendance.append({
            "attendee_id": a.attendee.pk,
            "date": a.get_training_date(),
            "sport_card": a.used_sport_card,
        })
    return JsonResponse({"attendance": attendance})


def attendance_summary(request, attendee_id=None, group_id=None, split_by_month=False):
    ''' Calculates the attendance statistics for the given attendee or group '''
    attendees = []
    if group_id is not None:
        attendees = Attendees.objects.filter(group=get_object_or_404(Groups, pk=group_id)).all()
    elif attendee_id is not None:
        attendees.append(get_object_or_404(Attendees, pk=attendee_id))

    return JsonResponse({"stats": calculate_attendance_summary(attendees, split_by_month=split_by_month, month_range=2)}) # later remove to switch back to 6


def list_payments(request, attendee_id):
    # get last 6 payments for this attendee
    data = Payment.objects.filter(
        attendee=get_object_or_404(Attendees, pk=attendee_id)
    ).order_by('-date').all()[:6]
    payments = []
    for p in data:
        payments.append({
            "date": p.date.strftime('%Y-%m-%d %H:%M'),
            "type": p.get_type_display(),
            "amount": p.amount,
            "tax_reported": p.tax_reported,
        })
    return JsonResponse({"payments": payments})


def get_current_outstanding(request, attendee_id=None, group_id=None):
    ''' Calculates the attendance statistics for the given attendee or group '''
    attendees = []
    if group_id is not None:
        attendees = Attendees.objects.filter(group=get_object_or_404(Groups, pk=group_id)).all()
    elif attendee_id is not None:
        attendees.append(get_object_or_404(Attendees, pk=attendee_id))

    amount = {}
    for a in attendees:
        # TODO: call payment calculation lib
        amount[a.pk] = 10;

    return JsonResponse({ "amount": amount })

# TODO: Implement session handling and make this dynamic
def get_session_status(request):
    session = {
        "attendee_id": 6,
        "sport_card": True,
        "status": "LoggedIn",
        "user": "LeHack",
        "role": "user"
    }
    return JsonResponse(session)

# TODO: fix this properly by implementing CSRF token handling in the front
@csrf_exempt
def update_attendance(request, *args, **kwargs):
    if request.method == "POST":
        attendance    = json.loads(request.POST["attendance"]);
        training      = get_object_or_404(TrainingSchedule, pk=request.POST["training_id"])
        training_time = timezone.make_aware(dateparse.parse_datetime(request.POST["training_time"]))
        for att in attendance:
            params = {
                "attendee": get_object_or_404(Attendees, pk=att["attendee_id"]),
                "training": training,
                "date": training_time,
            }

            if att["is_present"]:
                try:
                    a = Attendance.objects.get(**params)
                    a.used_sport_card = att["has_sport_card"]
                    a.save()
                except Attendance.DoesNotExist:
                    params["used_sport_card"] = att["has_sport_card"]
                    Attendance(**params).save()
            else:
                try:
                    # try removing it
                    Attendance.objects.filter(**params).all().delete()
                except Attendance.DoesNotExist:
                    # ignore if it doesn't exist
                    pass

    return JsonResponse({"request": "OK"})
