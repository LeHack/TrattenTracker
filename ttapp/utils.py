from datetime import date, timedelta
from ttapp.models import TrainingMonth, TrainingSchedule


def calculateTrainingDaysInMonth(group, year, month):
    day_count = None

    # first see if we have some custom setup already set
    try:
        day_count = TrainingMonth.objects.get(group=group, year=year, month=month).day_count
    except TrainingMonth.DoesNotExist:
        day_count = 0
        trainings = TrainingSchedule.objects.filter(group=group).all()
        iterdate = date(year, month, 1)
        while (iterdate.month == month):
            for t in trainings:
                if iterdate.weekday() == t.dow:
                    day_count += 1
                    break;
            # add days until we reach next month
            iterdate += timedelta(1)

    return day_count
