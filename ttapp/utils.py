from datetime import date, datetime, timedelta
from ttapp.models import CancelledTrainings, TrainingSchedule


def get_trainings_in_month(year, month, group=None):
    trainings = []
    schedules = TrainingSchedule.objects.order_by("dow", "begin_time").all()
    
    iterdate = date(year, month, 1)
    while (iterdate.month == month):
        for s in schedules:
            if iterdate.weekday() == s.dow:
                # optional group filtering
                if group is None or group == s.group:
                    trainings.append({
                        "group": s.group,
                        "date": datetime( iterdate.year, iterdate.month, iterdate.day, s.begin_time.hour, s.begin_time.minutes )
                    })
        # add days until we reach next month
        iterdate += timedelta(1)

    return trainings
