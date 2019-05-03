from freezegun import freeze_time

from . import update_latest_session


class TestGroup:
    def test_list(self, cli):
        r = cli.get('/list/groups')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['groups'][0] == {'group_id': 1, 'name': 'group 1', 'fee': 1}
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

    def test_list_by_month_empty(self, cli):
        r = cli.get('/list/trainings/year:2019/month:3')
        assert r.status_code == 200
        r_data = r.json()
        assert r_data['trainings'] == []


# class TestAttendance:
#     def test_list_by_attendee(self, cli):
#         r = cli.get('/list/attendance/attendee:1')
#         assert r.status_code == 200
#         r_data = r.json()
#         print(repr(r_data))
#         assert r_data['groups'][0] == {'group_id': 1, 'name': 'group 1', 'fee': 1}
#         assert r_data['selected'] == 1
# 
#     def test_list_by_date(self, cli):
#         r = cli.get('/list/attendance/date:2019-05-03/time:19:00')
#         assert r.status_code == 200
#         r_data = r.json()
#         print(repr(r_data))
#         assert r_data['groups'][0] == {'group_id': 1, 'name': 'group 1', 'fee': 1}
#         assert r_data['selected'] == 1
