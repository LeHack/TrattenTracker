from django.utils.timezone import datetime, make_aware as atz
from pytest import fixture
from ttapp.models import (
    Groups, Session, Attendees, TrainingSchedule, Attendance, Payment, MonthlyBalance
)


@fixture
def fake_group(db):  # @UnusedVariable
    g = Groups(name="group 1", monthly_fee="100")
    g.save()
    return g

@fixture
def fake_user(fake_group):
    a = Attendees(
        first_name="test",
        last_name="user",
        group=fake_group,
        login="user1",
        password="abc",
        role=Attendees.ATTENDEE
    )
    a.save()
    return a

@fixture
def fake_sensei(fake_group):
    a = Attendees(
        first_name="test",
        last_name="sensei",
        group=fake_group,
        login="sensei",
        password="abc",
        role=Attendees.SENSEI
    )
    a.save()
    return a
 
@fixture
def fake_session(fake_sensei):
    s = Session(secret="abc", user=fake_sensei)
    s.save()
    return s

@fixture
def cli(client, fake_session):
    client.cookies['_session'] = fake_session.cookie_value()
    return client

@fixture
def fake_schedule(fake_group):
    schedule = {
        "group": fake_group,
        "begin_time": "19:00",
        "end_time": "20:00",
        "start_date": datetime(year=2019, month=4, day=1),
    }
    ts1 = TrainingSchedule(**schedule, dow=0)
    ts1.save()
    ts2 = TrainingSchedule(**schedule, dow=3)
    ts2.save()
    return [ts1, ts2]

@fixture
def fake_attendance(fake_user, fake_schedule):
    (ts1, ts2) = fake_schedule
    common = {'attendee': fake_user}
    Attendance(**common, training=ts2, date=datetime(year=2019, month=5, day= 2), used_sport_card=True).save()
    Attendance(**common, training=ts1, date=datetime(year=2019, month=5, day= 6), used_sport_card=True).save()
    Attendance(**common, training=ts2, date=datetime(year=2019, month=5, day= 9), used_sport_card=True).save()
    Attendance(**common, training=ts1, date=datetime(year=2019, month=5, day=13), used_sport_card=False).save()
    return fake_user

@fixture
def fake_payments(fake_user):
    Payment(attendee=fake_user, type=Payment.CASH,     amount=100, date=atz(datetime(year=2019, month=4, day=2))).save()
    Payment(attendee=fake_user, type=Payment.TRANSFER, amount=50,  date=atz(datetime(year=2019, month=5, day=2))).save()
    MonthlyBalance(attendee=fake_user, year=2019, month=3, amount=0).save()
    return fake_user
