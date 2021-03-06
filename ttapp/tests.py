from django.test import TestCase
from django.utils import timezone, dateparse
import datetime
from ttapp.models import Groups, CancelledTrainings, TrainingSchedule, Attendance, Attendees, Payment, MonthlyBalance
from ttapp.utils import PaymentUtil


def seed_test_data():
    # first clear out the DB, note that removing a used group cascades trough *all* of the data in the system
    Groups.objects.all().delete()
    TrainingSchedule.objects.all().delete()
    Payment.objects.all().delete()

    # now create some test instances for every model
    g1 = Groups(name="Grupa Początkująca", monthly_fee=80)
    g1.save()

    g2 = Groups(name="Grupa Zaawansowana", monthly_fee=110)
    g2.save()

    start_date = datetime.date(2016, 10,  1)
    stop_date  = datetime.date(2016, 12, 10)
    g1t1 = TrainingSchedule(group=g1, dow=0, begin_time="19:00", end_time="20:00", start_date=start_date, stop_date=stop_date)
    g1t1.save()
    g1t2 = TrainingSchedule(group=g1, dow=3, begin_time="18:00", end_time="19:00", start_date=start_date, stop_date=stop_date)
    g1t2.save()
    g2t1 = TrainingSchedule(group=g2, dow=0, begin_time="20:00", end_time="21:00", start_date=start_date, stop_date=stop_date)
    g2t1.save()
    g2t2 = TrainingSchedule(group=g2, dow=1, begin_time="18:30", end_time="19:30", start_date=start_date) # this is not an error
    g2t2.save()
    g2t3 = TrainingSchedule(group=g2, dow=3, begin_time="19:00", end_time="20:00", start_date=start_date, stop_date=stop_date)
    g2t3.save()

    # single mixed training on 31st of October
    TrainingSchedule(
        dow=0, begin_time="19:00", end_time="20:00",
        start_date=datetime.date(2016, 10, 31), stop_date=datetime.date(2016, 10, 31)
    ).save()

    start_date = datetime.date(2016, 12, 12)
    stop_date  = datetime.date(2017,  1,  8)
    mixt1 = TrainingSchedule(dow=0, begin_time="19:00", end_time="20:00", start_date=start_date, stop_date=stop_date)
    mixt1.save()
    mixt2 = TrainingSchedule(dow=3, begin_time="18:30", end_time="19:30", start_date=start_date, stop_date=stop_date)
    mixt2.save()

    start_date = datetime.date(2017, 1, 9)
    g1t1_17 = TrainingSchedule(group=g1, dow=0, begin_time="19:00", end_time="20:00", start_date=start_date)
    g1t1_17.save()
    g1t2_17 = TrainingSchedule(group=g1, dow=3, begin_time="18:00", end_time="19:00", start_date=start_date)
    g1t2_17.save()
    g2t1_17 = TrainingSchedule(group=g2, dow=0, begin_time="20:00", end_time="21:00", start_date=start_date)
    g2t1_17.save()
    g2t3_17 = TrainingSchedule(group=g2, dow=3, begin_time="19:00", end_time="20:00", start_date=start_date)
    g2t3_17.save()

    CancelledTrainings(schedule=g1t1,  date = datetime.date(2016, 10, 31)).save()
    CancelledTrainings(schedule=g2t1,  date = datetime.date(2016, 10, 31)).save()
    CancelledTrainings(schedule=g2t2,  date = datetime.date(2016, 11,  1)).save()
    CancelledTrainings(schedule=mixt1, date = datetime.date(2016, 12, 26)).save()
    CancelledTrainings(schedule=g2t2,  date = datetime.date(2016, 12, 27)).save()

    fakeData = [
        {
            "group": g1,
            "first_name": "Jan",
            "last_name": "Kowalski",
            "login": "jkowalski",
            "password": "haslo",
            "attendance": [
                { "training": g1t1, "date": "2016-12-05" },
                { "training": g1t2, "date": "2016-12-08" },
                { "training": mixt1, "date": "2016-12-12" },
                { "training": mixt2, "date": "2016-12-15" },
                { "training": mixt1, "date": "2016-12-19" },
                { "training": mixt2, "date": "2016-12-22" },
                { "training": mixt2, "date": "2016-12-29" },
                { "training": mixt1, "date": "2017-01-02" },
                { "training": mixt2, "date": "2017-01-05" },
            ],
            "payments": [
                { "type": Payment.CASH,     "amount": 60,  "date": "2016-12-05 18:49:00" },
                { "type": Payment.TRANSFER, "amount": 100, "date": "2017-01-02 18:55:00", "tax": False  },
            ],
            "balance": [
                { "year": 2016, "month": 11, "amount": 0 },
                { "year": 2016, "month": 12, "amount": -20 },
                { "year": 2017, "month": 1,  "amount": 0 }
            ]
        },
        {
            "group": g1,
            "first_name": "Marian",
            "last_name": "Nowak",
            "login": "mnowak",
            "password": "haslo",
            "has_sport_card": True,
            "discount": 20,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05" },
                { "training": g1t2, "date": "2016-12-08", "card": True },
                { "training": mixt2, "date": "2016-12-15", "card": True },
                { "training": mixt1, "date": "2016-12-19", "card": True },
                { "training": mixt2, "date": "2016-12-29", "card": True },
                { "training": mixt1, "date": "2017-01-02" },
            ],
            "payments": [
                { "type": Payment.TRANSFER, "amount": 100, "date": "2016-11-27 11:15:00" },
                { "type": Payment.CASH,     "amount": 60,  "date": "2016-12-05 18:49:00" },
                { "type": Payment.TRANSFER, "amount": 80,  "date": "2017-01-02 18:55:00", "tax": False  },
            ],
            "balance": [
                { "year": 2016, "month": 11, "amount": 20 },
                { "year": 2016, "month": 12, "amount": 0 },
                { "year": 2017, "month": 1,  "amount": 0 }
            ]
        },
        {
            "group": g1,
            "first_name": "Robert",
            "last_name": "Zamły",
            "login": "rzamly",
            "password": "haslo",
            "has_sport_card": True,
            "attendance": [
                { "training": g1t1, "date": "2016-12-01", "card": True },
                { "training": g1t1, "date": "2016-12-05", "card": True },
                { "training": mixt1, "date": "2016-12-12", "card": True },
                { "training": mixt2, "date": "2016-12-15", "card": True },
                { "training": mixt1, "date": "2016-12-19", "card": True },
                { "training": mixt2, "date": "2016-12-29", "card": True },
                { "training": mixt2, "date": "2017-01-05", "card": True },
            ],
            "payments": [
                { "type": Payment.TRANSFER, "amount": 100, "date": "2016-11-27 11:15:00" },
                { "type": Payment.TRANSFER, "amount": 100, "date": "2016-12-15 12:55:00" },
            ],
        },
        {
            "group": g1,
            "first_name": "Zofia",
            "last_name": "Pomak",
            "login": "zpomak",
            "password": "haslo",
            "discount": 20,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05" },
                { "training": mixt1, "date": "2016-12-12" },
                { "training": mixt2, "date": "2016-12-15" },
                { "training": mixt1, "date": "2016-12-19" },
                { "training": mixt2, "date": "2016-12-29" },
                { "training": mixt1, "date": "2017-01-02" },
            ],
        },
        {
            "group": g1,
            "first_name": "Slackish",
            "last_name": "Slacker",
            "login": "sslack",
            "password": "haslo",
            "active": False,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05" },
                { "training": mixt1, "date": "2016-12-12" },
                { "training": mixt2, "date": "2016-12-15" },
                { "training": mixt1, "date": "2016-12-19" },
                { "training": mixt2, "date": "2016-12-29" },
                { "training": mixt1, "date": "2017-01-02" },
            ],
        },
        {
            "group": g2,
            "first_name": "John",
            "last_name": "Wayne",
            "login": "jwayne",
            "password": "haslo",
            "has_sport_card": True,
            "attendance": [
                { "training": g2t3,  "date": "2016-12-01", "card": True },
                { "training": g2t1,  "date": "2016-12-05", "card": True },
                { "training": g2t2,  "date": "2016-12-06", "card": True },
                { "training": g1t2,  "date": "2016-12-08" },
                { "training": g2t3,  "date": "2016-12-08" },
                { "training": mixt1, "date": "2016-12-12", "card": True },
                { "training": g2t2,  "date": "2016-12-13", "card": True },
                { "training": mixt2, "date": "2016-12-15", "card": True },
                { "training": mixt1, "date": "2016-12-19", "card": True },
                { "training": mixt2, "date": "2016-12-22" },
                { "training": mixt2, "date": "2016-12-29", "card": True },
                { "training": g2t2,  "date": "2017-01-03", "card": True },
            ],
            "payments": [],
            "balance": [
                { "year": 2016, "month": 12, "amount": -50 },
                { "year": 2017, "month": 1,  "amount": -160 }
            ]
        },
        {
            "group": g2,
            "first_name": "Bruce",
            "last_name": "Lee",
            "login": "bruce",
            "password": "haslo",
            "has_sport_card": True,
            "discount": 20,
            "attendance": [
                { "training": g1t2,     "date": "2016-12-01", "card": True },
                { "training": g2t3,     "date": "2016-12-01", "card": True },
                { "training": g1t1,     "date": "2016-12-05", "card": True },
                { "training": g2t1,     "date": "2016-12-05", "card": True },
                { "training": g2t2,     "date": "2016-12-06", "card": True },
                { "training": g1t2,     "date": "2016-12-08", "card": True },
                { "training": g2t3,     "date": "2016-12-08", "card": True },
                { "training": mixt1,    "date": "2016-12-12", "card": True },
                { "training": g2t2,     "date": "2016-12-13", "card": True },
                { "training": mixt2,    "date": "2016-12-15", "card": True },
                { "training": mixt1,    "date": "2016-12-19", "card": True },
                { "training": g2t2,     "date": "2016-12-20", "card": True },
                { "training": mixt2,    "date": "2016-12-22", "card": True },
                { "training": mixt2,    "date": "2016-12-29", "card": True },
                { "training": mixt1,    "date": "2017-01-02", "card": True },
                { "training": g2t2,     "date": "2017-01-03", "card": True },
                { "training": mixt2,    "date": "2017-01-05", "card": True },
                { "training": g1t1_17,  "date": "2017-01-09", "card": True },
                { "training": g2t1_17,  "date": "2017-01-09", "card": True },
                { "training": g2t2,     "date": "2017-01-10", "card": True },
                { "training": g1t2_17,  "date": "2017-01-12", "card": True },
                { "training": g2t3_17,  "date": "2017-01-12", "card": True },
                { "training": g1t1_17,  "date": "2017-01-16", "card": True },
                { "training": g2t1_17,  "date": "2017-01-16", "card": True },
                { "training": g2t2,     "date": "2017-01-17", "card": True },
                { "training": g1t2_17,  "date": "2017-01-19", "card": True },
                { "training": g2t3_17,  "date": "2017-01-19", "card": True },
            ],
            "payments": [
                { "type": Payment.CASH, "amount": 110, "date": "2016-11-12 11:15:00" },
                { "type": Payment.CASH, "amount": 110, "date": "2016-12-10 12:55:00" },
                { "type": Payment.CASH, "amount": 110, "date": "2017-01-02 19:55:00", "tax": False },
            ],
            "balance": [
                { "year": 2016, "month": 11, "amount": 0 },
                { "year": 2016, "month": 12, "amount": 0 },
                { "year": 2017, "month": 1,  "amount": 0 }
            ],
        },
        {
            "group": g2,
            "first_name": "Łukasz",
            "last_name": "Hejnak",
            "login": "lehack",
            "password": "haslo",
            "role": Attendees.SENSEI,
        },
    ]

    for at in fakeData:
        at_params = {
            "group":      at["group"],
            "first_name": at["first_name"],
            "last_name":  at["last_name"],
            "login":      at["login"],
            "password":   at["password"],
        }
        for optional in ("has_sport_card", "discount", "role", "active"):
            if optional in at:
                at_params[optional] = at[optional]

        a = Attendees(**at_params)
        a.save()

        if "attendance" in at:
            for tr in at["attendance"]:
                att_params = {
                    "attendee": a, "training": tr["training"], "date": tr["date"]
                }
                if "card" in tr:
                    att_params["used_sport_card"] = tr["card"]

                Attendance(**att_params).save()

        if "payments" in at:
            for pay in at["payments"]:
                date=timezone.make_aware(dateparse.parse_datetime(pay["date"]))
                if "tax" in pay:
                    Payment(attendee=a, date=date, type=pay["type"], amount=pay["amount"], tax_reported=pay["tax"]).save()
                else:
                    Payment(attendee=a, date=date, type=pay["type"], amount=pay["amount"], tax_reported=True).save()

        if "balance" in at:
            for bal in at["balance"]:
                MonthlyBalance(attendee=a, year=bal["year"], month=bal["month"], amount=bal["amount"]).save()

# todo: more testing needed, especially for total balance calculation
class UtilsTestCase(TestCase):
    payUtil = PaymentUtil()

    def setUp(self):
        seed_test_data()

    def test_get_monthly_payment__should_return_fixed_payment(self):
        time = datetime.date(2017, 1, 1)
        attendee = Attendees.objects.filter(has_sport_card=False)[0]
        cost = self.payUtil.get_monthly_payment(time.year, time.month, attendee)
        self.assertEqual(attendee.group.monthly_fee, cost)

    def test_get_monthly_payment__should_calculate_payment(self):
        time = datetime.date(2017, 1, 1)
        attendee = Attendees.objects.filter(has_sport_card=True)[0]
        cost = self.payUtil.get_monthly_payment(time.year, time.month, attendee)
        self.assertEqual(70, cost)

    def test_get_total_current_balance(self):
        attendee = Attendees.objects.filter(has_sport_card=True)[1]
        cost = self.payUtil.get_total_current_balance(attendee)
        self.assertEqual(90, cost)
