from datetime import date, datetime, timedelta
from django.db.models import Q
from ttapp.models import CancelledTrainings, TrainingSchedule, Groups, Attendance


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
        attendence_count = Attendance.objects.filter(attendee=attendee,
                                                     date__gte=start,
                                                     date__lte=self.last_day_of_month(month)).count()
        return attendee.group.monthly_fee - (attendence_count * self.money_from_sport_card)

    @staticmethod
    def last_day_of_month(month):
        time = datetime.now().replace(month=month)
        next_month = time.replace(day=28) + timedelta(days=4)  # this will never fail
        return next_month - timedelta(days=next_month.day)