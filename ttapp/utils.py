from datetime import date, datetime, timedelta
from django.db.models import Q
from ttapp.models import CancelledTrainings, TrainingSchedule


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
                cancelled = CancelledTrainings.objects.filter(schedule=s, date=iterdate).all()
                if len(cancelled) > 0:
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
