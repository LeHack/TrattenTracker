from django.test import TestCase
from django.utils import timezone, dateparse
from ttapp.models import Groups, TrainingMonth, TrainingSchedule, Attendance, Attendees, Payment, MonthlyBalance


def seed_test_data():
    # first clear out the DB, note that removing a used group cascades trough *all* of the data in the system
    Groups.objects.all().delete()
    # now create some test instances for every model
    g1 = Groups(name="Grupa Początkująca", monthly_fee=80)
    g1.save()

    g2 = Groups(name="Grupa Zaawansowana", monthly_fee=110)
    g2.save()

    g1t1 = TrainingSchedule(group=g1, dow=0, begin_time="19:00", end_time="20:00")
    g1t1.save()
    g1t2 = TrainingSchedule(group=g1, dow=3, begin_time="18:00", end_time="19:00")
    g1t2.save()
    g2t1 = TrainingSchedule(group=g2, dow=0, begin_time="20:00", end_time="21:00")
    g2t1.save()
    g2t2 = TrainingSchedule(group=g2, dow=1, begin_time="18:30", end_time="19:30")
    g2t2.save()
    g2t3 = TrainingSchedule(group=g2, dow=3, begin_time="19:00", end_time="20:00")
    g2t3.save()

    TrainingMonth(group=g1, year=2016, month=11, day_count=9).save()
    TrainingMonth(group=g2, year=2016, month=11, day_count=11).save()
    TrainingMonth(group=g1, year=2016, month=12, day_count=8).save()
    TrainingMonth(group=g2, year=2016, month=12, day_count=11).save()

    fakeData = [
        {
            "group": g1,
            "first_name": "Jan",
            "last_name": "Kowalski",
            "sport_card": False,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05 19:01:00" },
                { "training": g1t2, "date": "2016-12-08 18:01:00" },
                { "training": g1t1, "date": "2016-12-12 19:01:00" },
                { "training": g1t2, "date": "2016-12-15 18:31:00" },
                { "training": g1t1, "date": "2016-12-19 19:01:00" },
                { "training": g1t2, "date": "2016-12-22 18:31:00" },
                { "training": g1t2, "date": "2016-12-29 18:31:00" },
                { "training": g1t2, "date": "2017-01-02 19:01:00" },
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
            "sport_card": True,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05 19:01:00" },
                { "training": g1t2, "date": "2016-12-08 18:01:00", "card": True },
                { "training": g1t2, "date": "2016-12-15 18:31:00", "card": True },
                { "training": g1t1, "date": "2016-12-19 19:01:00", "card": True },
                { "training": g1t2, "date": "2016-12-29 18:31:00", "card": True },
                { "training": g1t2, "date": "2017-01-02 19:01:00" },
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
            "sport_card": True,
            "attendance": [
                { "training": g1t1, "date": "2016-12-01 18:01:00", "card": True },
                { "training": g1t1, "date": "2016-12-05 19:01:00", "card": True },
                { "training": g1t1, "date": "2016-12-12 18:01:00", "card": True },
                { "training": g1t2, "date": "2016-12-15 18:31:00", "card": True },
                { "training": g1t1, "date": "2016-12-19 19:01:00", "card": True },
                { "training": g1t2, "date": "2016-12-29 18:31:00", "card": True },
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
            "sport_card": False,
            "attendance": [
                { "training": g1t1, "date": "2016-12-05 19:01:00" },
                { "training": g1t1, "date": "2016-12-12 18:01:00" },
                { "training": g1t2, "date": "2016-12-15 18:31:00" },
                { "training": g1t1, "date": "2016-12-19 19:01:00" },
                { "training": g1t2, "date": "2016-12-29 18:31:00" },
                { "training": g1t2, "date": "2017-01-02 19:01:00" },
            ],
        },
        {
            "group": g2,
            "first_name": "John",
            "last_name": "Wayne",
            "sport_card": True,
            "attendance": [
                { "training": g2t3, "date": "2016-12-01 19:01:00", "card": True },
                { "training": g2t1, "date": "2016-12-05 20:00:00", "card": True },
                { "training": g2t2, "date": "2016-12-06 18:31:00", "card": True },
                { "training": g1t2, "date": "2016-12-08 18:02:00" },
                { "training": g2t3, "date": "2016-12-08 19:02:00" },
                { "training": g1t1, "date": "2016-12-12 19:01:00", "card": True },
                { "training": g2t1, "date": "2016-12-12 20:01:00", "card": True },
                { "training": g2t2, "date": "2016-12-13 18:31:00", "card": True },
                { "training": g2t3, "date": "2016-12-15 18:29:00", "card": True },
                { "training": g2t2, "date": "2016-12-19 18:31:00", "card": True },
                { "training": g2t3, "date": "2016-12-22 18:29:00" },
                { "training": g2t3, "date": "2016-12-29 18:31:00", "card": True },
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
            "sport_card": True,
            "attendance": [
                { "training": g1t2, "date": "2016-12-01 18:01:00", "card": True },
                { "training": g2t3, "date": "2016-12-01 19:01:00", "card": True },
                { "training": g1t1, "date": "2016-12-05 19:00:00", "card": True },
                { "training": g2t1, "date": "2016-12-05 20:00:00", "card": True },
                { "training": g2t2, "date": "2016-12-06 18:31:00", "card": True },
                { "training": g1t2, "date": "2016-12-08 18:02:00", "card": True },
                { "training": g2t3, "date": "2016-12-08 19:02:00", "card": True },
                { "training": g2t1, "date": "2016-12-12 20:01:00", "card": True },
                { "training": g2t2, "date": "2016-12-13 18:31:00", "card": True },
                { "training": g2t3, "date": "2016-12-15 18:29:00", "card": True },
                { "training": g2t2, "date": "2016-12-20 18:31:00", "card": True },
                { "training": g2t3, "date": "2016-12-22 18:29:00", "card": True },
                { "training": g2t3, "date": "2016-12-29 18:31:00", "card": True },
                { "training": g1t2, "date": "2017-01-02 19:01:00", "card": True  },
                { "training": g1t2, "date": "2017-01-03 18:30:15", "card": True  },
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
    ]

    for at in fakeData:
        a = Attendees(group=at["group"], first_name=at["first_name"], last_name=at["last_name"], has_sport_card=at["sport_card"])
        a.save()
        for tr in at["attendance"]:
            date=timezone.make_aware(dateparse.parse_datetime(tr["date"]))
            if "card" in tr:
                Attendance(attendee=a, training=tr["training"], date=date, used_sport_card=tr["card"]).save()
            else:
                Attendance(attendee=a, training=tr["training"], date=date).save()

        if "payments" in at:
            for pay in at["payments"]:
                if "tax" in pay:
                    Payment(attendee=a, type=pay["type"], amount=pay["amount"], tax_reported=pay["tax"]).save()
                else:
                    Payment(attendee=a, type=pay["type"], amount=pay["amount"], tax_reported=True).save()

        if "balance" in at:
            for bal in at["balance"]:
                MonthlyBalance(attendee=a, year=bal["year"], month=bal["month"], amount=bal["amount"]).save()

