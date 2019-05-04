from django.utils import timezone
from freezegun import freeze_time

from . import update_latest_session
from ttapp.models import Attendees


class TestGroup:
    def test_list(self, cli):
        r = cli.get('/list/groups')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['groups'][0] == {'group_id': 1, 'name': 'group 1', 'fee': 100}
        assert r_data['selected'] == 1


class TestAttendees:
    def test_list(self, cli, fake_user):
        r = cli.get('/list/attendees')
        assert r.status_code == 200
        r_data = r.json()
        print(repr(r_data))
        assert r_data['attendees'][0] == {'attendee_id': 1, 'group_id': 1, 'name': 'test sensei', 'sport_card': False}
        assert r_data['attendees'][1] == {'attendee_id': 2, 'group_id': 1, 'name': 'test user', 'sport_card': False}

    def test_list_per_group(self, cli, fake_user):
        '''
            Group view omits Sensei.
        '''
        r = cli.get('/list/attendees/group:1')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['attendees'][0] == {'attendee_id': 2, 'group_id': 1, 'name': 'test user', 'sport_card': False}


class TestTrainings:
    @freeze_time("2019-05-15 18:00")
    def test_list_latest(self, cli, fake_schedule):
        update_latest_session()
        r = cli.get('/list/trainings/latest')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['trainings']) == 6
        assert r_data['trainings'][2] == {
            'name': '2019-05-02 19:00',
            'id': 'training10',
            'training_id': 2,
            'date': '2019-05-02',
            'time': '19:00',
            'year': '2019',
            'month': '05',
        }
        assert r_data['selected'] == 'training13'

    def test_list_by_month(self, cli, fake_schedule):
        r = cli.get('/list/trainings/year:2019/month:4')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['trainings']) == 9
        assert r_data['selected'] == 'training9'
        assert r_data['trainings'][0]['date'] == '2019-04-01'
        assert r_data['trainings'][-1]['date'] == '2019-04-29'

    def test_list_by_month_empty(self, cli):
        r = cli.get('/list/trainings/year:2019/month:3')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['trainings'] == []


class TestAttendance:
    @freeze_time("2019-05-15 18:00")
    def test_list_by_attendee(self, cli, fake_attendance):
        update_latest_session()
        aid = fake_attendance.id
        r = cli.get(f'/list/attendance/attendee:{aid}/month:2019-05')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['attendance']) == 4

        attendance = r_data['attendance'][0]
        assert attendance['attendee_id'] == aid
        assert attendance['date'] == '2019-05-02 19:00'
        assert attendance['sport_card']

        attendance = r_data['attendance'][-1]
        assert attendance['attendee_id'] == aid
        assert attendance['date'] == '2019-05-13 19:00'
        assert not attendance['sport_card']

    @freeze_time("2019-05-15 18:00")
    def test_list_by_date(self, cli, fake_attendance):
        update_latest_session()
        aid = fake_attendance.id

        r = cli.get('/list/attendance/date:2019-05-02/time:19:00')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['attendance']) == 1
        attendance = r_data['attendance'][0]
        assert attendance['attendee_id'] == aid
        assert attendance['date'] == '2019-05-02 19:00'
        assert attendance['sport_card']

        r = cli.get('/list/attendance/date:2019-05-13/time:19:00')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['attendance']) == 1
        attendance = r_data['attendance'][0]
        assert attendance['attendee_id'] == aid
        assert attendance['date'] == '2019-05-13 19:00'
        assert not attendance['sport_card']

    @freeze_time("2019-05-15 18:00")
    def test_summary_by_group(self, cli, fake_attendance):
        update_latest_session()
        aid = str(fake_attendance.id)
        gid = fake_attendance.group.id
        r = cli.get(f'/summarize/attendance/group:{gid}')
        assert r.status_code == 200
        r_data = r.json()['stats']
        assert r_data[aid]['basic'] == {'count': 4, 'freq': '30'}
        assert r_data[aid]['extra'] == {'count': 0}

    @freeze_time("2019-05-15 18:00")
    def test_summary_by_attendee_total(self, cli, fake_attendance):
        update_latest_session()
        aid = str(fake_attendance.id)
        r = cli.get(f'/summarize/attendance/attendee:{aid}/total')
        assert r.status_code == 200
        r_data = r.json()['stats']
        assert r_data[aid]['basic'] == {'count': 4, 'freq': '30'}
        assert r_data[aid]['extra'] == {'count': 0}

    @freeze_time("2019-05-15 18:00")
    def test_summary_by_attendee_monthly(self, cli, fake_attendance):
        update_latest_session()
        aid = str(fake_attendance.id)
        r = cli.get(f'/summarize/attendance/attendee:{aid}/monthly')
        assert r.status_code == 200
        r_data = r.json()['stats'][aid]
        assert len(r_data) == 6
        assert r_data[0]['month'] == 'Grudnia 2018'
        assert r_data[0]['raw_month'] == '2018-12'
        assert r_data[0]['basic'] == {'count': 0, 'freq': 0}
        assert r_data[0]['extra'] == {'count': 0, 'freq': 0}

        assert r_data[-1]['month'] == 'Maja 2019'
        assert r_data[-1]['raw_month'] == '2019-05'
        assert r_data[-1]['basic'] == {'count': 4, 'freq': '100'}
        assert r_data[-1]['extra'] == {'count': 0, 'freq': 0}


class TestPayments:
    def test_list_for_attendee(self, cli, fake_payments):
        aid = fake_payments.id
        r = cli.get(f'/list/payments/attendee:{aid}')
        assert r.status_code == 200
        r_data = r.json()
        assert len(r_data['payments']) == 2
        assert r_data['payments'][0] == {'date': '2019-05-02 00:00', 'type': 'Przelew', 'amount': 50, 'tax_reported': False}

    def test_get_monthly_fee(self, cli, fake_user):
        r = cli.get(f'/get/fee/attendee:{fake_user.id}')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['amount'] == 100

    def test_summary_for_attendee(self, cli, fake_payments):
        aid = str(fake_payments.id)
        r = cli.get(f'/summarize/payments/attendee:{aid}')
        assert r.status_code == 200
        r_data = r.json()['attendee']
        assert r_data[aid] == {'outstanding': 50, 'monthly': 100}

    def test_summary_for_group(self, cli, fake_payments):
        aid = str(fake_payments.id)
        gid = fake_payments.group.id
        r = cli.get(f'/summarize/payments/group:{gid}')
        assert r.status_code == 200
        r_data = r.json()['attendee']
        assert r_data[aid] == {'outstanding': 50, 'monthly': 100}


class TestSession:
    def test_valid_session(self, cli):
        r = cli.get('/get/session')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['logged in']
        assert r_data['attendee_id'] == Attendees.objects.get(role=Attendees.SENSEI).id
        assert not r_data['sport_card']
        assert r_data['name'] == 'test sensei'
        assert r_data['role'] == 'SENSEI'

    def test_invalid_session(self, cli):
        update_latest_session(timezone.now() - timezone.timedelta(hours=10))
        r = cli.get('/get/session')
        assert r.status_code == 200
        r_data = r.json()
        assert not r_data['logged in']
