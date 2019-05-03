from datetime import datetime
from pytest import fixture
from ttapp.models import Groups, Session, Attendees, TrainingSchedule, Attendance


@fixture
def fake_group(db):  # @UnusedVariable
    g = Groups(name="group 1", monthly_fee="1")
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
    TrainingSchedule(**schedule, dow=0).save()
    TrainingSchedule(**schedule, dow=3).save()

@fixture
def fake_attendance(fake_user, fake_schedule):
    for ts in TrainingSchedule.objects.all():
        at = Attendance(
            attendee=fake_user,
            training=ts,
            date=datetime.today(),
            used_sport_card=True,
        )
        at.save()
