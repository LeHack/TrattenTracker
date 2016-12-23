from django.test import TestCase
from ttapp.models import Groups, TrainingMonth, TrainingSchedule, Attendance, Attendees, Payment, MonthlyBalance


def seed_test_data():
    # first clear out the DB, note that removing a used group cascades trough *all* of the data in the system
    Groups.objects.all().delete()
    # now create some test instances for every model
    g = Groups(name="Grupa Początkująca", monthly_fee=80)
    g.save()

    TrainingMonth(group=g, year=2016, month=11, day_count=9).save()

    a = Attendees(group=g, first_name="Jan", last_name="Kowalski")
    a.save()

    t1 = TrainingSchedule(group=g, dow=0, begin_time="19:00", end_time="20:00")
    t1.save()
    t2 = TrainingSchedule(group=g, dow=3, begin_time="18:00", end_time="19:00")
    t2.save()

    Attendance(attendee=a, training=t1).save()
    Attendance(attendee=a, training=t2, used_sport_card=True).save()
    Attendance(attendee=a).save()

    Payment(attendee=a, type=Payment.CASH, amount=100, tax_reported=True).save()
    Payment(attendee=a, type=Payment.CASH, amount=20).save()

    MonthlyBalance(attendee=a, year=2016, month=11, amount=-100).save()
    MonthlyBalance(attendee=a, year=2016, month=12, amount=20).save()
