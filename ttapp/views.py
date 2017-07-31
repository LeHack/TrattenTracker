import json
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Q
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import timezone, dateparse
from ttapp.models import Groups, Attendance, Attendees, Payment, MonthlyBalance, TrainingSchedule
from ttapp.auth import Auth, request_authenticated
from ttapp.utils import get_trainings_in_month, calculate_attendance_summary, PaymentUtil


def _is_not_sensei(auth):
    return (auth.session.user.role != Attendees.SENSEI)

def _is_not_sensei_nor_attendee(auth, attendee_id):
    return (auth.session.user.role != Attendees.SENSEI and str(auth.session.user.pk) != str(attendee_id))


@request_authenticated
def list_groups(request, auth=None):
    if _is_not_sensei(auth):
        return HttpResponseForbidden()

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


@request_authenticated
def list_attendees(request, group_id=None, auth=None):
    if _is_not_sensei(auth):
        return HttpResponseForbidden()

    query = Attendees.objects
    if group_id is not None:
        query = query.filter(group=get_object_or_404(Groups, pk=group_id), role=Attendees.ATTENDEE, active=True)

    data = []
    for a in query.all():
        data.append({
            "attendee_id": a.pk,
            "group_id": a.group.pk,
            "name": "%s %s" % (a.first_name, a.last_name),
            "sport_card": a.has_sport_card,
        })
    return JsonResponse({"attendees": data})


@request_authenticated
def list_trainings(request, year=None, month=None, auth=None):
    ''' List  all trainings from all groups for the given month and automatically select the closest one (see issue#10) '''

    if _is_not_sensei(auth):
        return HttpResponseForbidden()

    trainings = []
    today = datetime.today()
    months = []
    how_many = 6
    if year and month:
        how_many = None # all
        months.append( date(int(year), int(month), 1) )
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
                    "training_id": t["training"].pk,
                    "id":    "training" + str(tmpId),
                    "date":  t_date,
                    "time":  t_time,
                    "name":  "%s %s" % (t_date, t_time),
                    "year":  t["date"].strftime("%Y"),
                    "month": t["date"].strftime("%m"),
                }
                trainings.append(training)
                tmpId += 1
    trainings = sorted(trainings, key=lambda s: s["date"])
    if how_many:
        trainings = trainings[-1 * how_many:]
    # by default select the last one
    return JsonResponse({"trainings": trainings, "selected": trainings[-1]["id"]})


@request_authenticated
def list_attendance(request, date=None, time=None, month=None, attendee_id=None, auth=None):
    if _is_not_sensei_nor_attendee(auth, attendee_id):
        return HttpResponseForbidden()

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
            # for admin view - should be filtered when fetching data for users
            "added": a.added.strftime('%Y-%m-%d %H:%M'),
            "sport_card": a.used_sport_card,
        })

    attendance = sorted(attendance, key=lambda a: a["date"])
    return JsonResponse({"attendance": attendance})


@request_authenticated
def attendance_summary(request, attendee_id=None, group_id=None, split_by_month=False, auth=None):
    ''' Calculates the attendance statistics for the given attendee or group '''

    if _is_not_sensei_nor_attendee(auth, attendee_id):
        return HttpResponseForbidden()

    attendees = []
    if group_id is not None:
        attendees = Attendees.objects.filter(group=get_object_or_404(Groups, pk=group_id)).all()
    elif attendee_id is not None:
        attendees.append(get_object_or_404(Attendees, pk=attendee_id))

    return JsonResponse({
        "stats": calculate_attendance_summary(attendees, split_by_month=split_by_month, month_range=6),
    }) # later remove to switch back to 6


@request_authenticated
def list_payments(request, attendee_id, auth=None):
    if _is_not_sensei_nor_attendee(auth, attendee_id):
        return HttpResponseForbidden()

    # get last 6 payments for this attendee
    data = Payment.objects.filter(
        attendee=get_object_or_404(Attendees, pk=attendee_id)
    ).order_by('-date').all()[:10]
    payments = []
    for p in data:
        payments.append({
            "date": p.date.strftime('%Y-%m-%d %H:%M'),
            "type": p.get_type_display(),
            "amount": p.amount,
            "tax_reported": p.tax_reported,
        })
    return JsonResponse({"payments": payments})


@request_authenticated
def get_current_outstanding(request, attendee_id=None, group_id=None, auth=None):
    ''' Calculates the payment statistics for the given attendee or group '''

    if _is_not_sensei_nor_attendee(auth, attendee_id):
        return HttpResponseForbidden()

    attendees = []
    if group_id:
        attendees = Attendees.objects.filter(group=get_object_or_404(Groups, pk=group_id), role=Attendees.ATTENDEE, active=True).all()
    elif attendee_id:
        attendees.append(get_object_or_404(Attendees, pk=attendee_id))

    amount = {}
    pu = PaymentUtil()
    for a in attendees:
        amount[a.pk] = {
            "outstanding": pu.get_total_current_balance(a),
            "monthly": a.get_monthly_fee(),
        };

    return JsonResponse({ "attendee": amount })


@request_authenticated
def get_monthly_fee(request, attendee_id, auth=None):

    if _is_not_sensei_nor_attendee(auth, attendee_id):
        return HttpResponseForbidden()

    pu = PaymentUtil()
    attendee = get_object_or_404(Attendees, pk=attendee_id);
    now = datetime.now()
    return JsonResponse({ "amount": pu.get_monthly_payment(now.year, now.month, attendee) })


def get_session_status(request):
    out = None

    try:
        auth = Auth(request=request)
        out = auth.set_cookie( JsonResponse( auth.as_response() ) )
    except (Auth.BadCookie, Auth.BadCredentials):
        out = JsonResponse({ "logged in": False })

    return out


def login(request):
    resp = JsonResponse({"logged in": False})
    if request.method == "POST" and "login" in request.POST and "password" in request.POST:
        try:
            a = Auth(login=request.POST["login"], password=request.POST["password"])
            resp = JsonResponse({"logged in": True})
            a.set_cookie(resp)
        except Auth.BadCredentials:
            pass

    return resp

def logout(request):
    resp = JsonResponse({"logged out": True})
    try:
        Auth(request=request).logout()
    except (Auth.BadCookie, Auth.BadCredentials):
        pass

    return resp


@request_authenticated
def update_attendance(request, auth=None, *args, **kwargs):
    if _is_not_sensei(auth):
        return HttpResponseForbidden()

    if request.method == "POST":
        attendance    = json.loads(request.POST["attendance"]);
        training      = get_object_or_404(TrainingSchedule, pk=request.POST["training_id"])
        training_time = request.POST["training_time"].split(" ")[0]
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


@request_authenticated
def update_payment(request, auth=None, *args, **kwargs):
    if _is_not_sensei(auth):
        return HttpResponseForbidden()

    if request.method == "POST":
        payment = json.loads(request.POST["payment"]);
        params = {
            "attendee": get_object_or_404(Attendees, pk=payment["attendee_id"]),
            "amount": payment["amount"],
            "tax_reported": payment["tax"],
            "type": payment["type"],
        }
        Payment(**params).save()

    return JsonResponse({"request": "OK"})
