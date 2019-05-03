from pytest import fixture, mark
from pytest_django.fixtures import client
from .models import Groups, Session, Attendees


@fixture
def prep_data():
    return [1,2,3]


def test_test(prep_data):
    assert len(prep_data) == 3, "Fixture test"

def test_ok():
    assert "A" == "A", "ASCII didnt change"

@mark.django_db
def test_db_access():
    print(repr(Groups.objects.all()))
    Groups(name="Some new group", monthly_fee="8080").save()
    print(repr(Groups.objects.all()))
    assert 0

@mark.django_db
def test_group_list(client):
    g = Groups(name="group 1", monthly_fee="1")
    g.save()
    a = Attendees(first_name="test", last_name="user", group=g, password="abc", role=Attendees.SENSEI)
    a.save()
    s = Session(secret="abc", user=a)
    s.save()
    client.cookies['_session'] = s.cookie_value()
    r = client.get('/list/groups')
    assert r.status_code == 200
    r_data = r.json()
    assert r_data['groups'][0] == {'group_id': 1, 'name': 'group 1', 'fee': 1}
    assert r_data['selected'] == 1
