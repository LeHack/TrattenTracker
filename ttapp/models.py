import calendar, hashlib, shortuuid
from datetime import timedelta
from django.utils import timezone
from django.db import models
from trattrack import settings


class Groups(models.Model):
    name        = models.CharField('nazwa', max_length=100, unique=True)
    monthly_fee = models.IntegerField('kwota')

    class Meta:
        verbose_name = "grupa"
        verbose_name_plural = "Grupy"

    def __str__(self):
        return self.name


class TrainingSchedule(models.Model):
    group               = models.ForeignKey(Groups, related_name='trainings', verbose_name="Grupa", null=True, blank=True)
    dow                 = models.IntegerField('dzień tygodnia')
    begin_time          = models.TimeField('czas rozpoczęcia')
    end_time            = models.TimeField('czas zakończenia')
    sport_card_allowed  = models.BooleanField('czy karty sportowe są dozwolone', default=True)
    start_date          = models.DateField('od daty', default=timezone.now)
    stop_date           = models.DateField('do daty', blank=True, null=True)

    class Meta:
        unique_together = (("group", "dow", "begin_time", "start_date"),)
        verbose_name = "trening"
        verbose_name_plural = "Grafik zajęć"

    def __str__(self):
        return "%s: %s - %s (from %s)" % (
            calendar.day_name[self.dow],
            self.begin_time.strftime('%H:%M'),
            self.end_time.strftime('%H:%M'),
            self.start_date.strftime('%Y-%m-%d')
        )


class CancelledTrainings(models.Model):
    schedule  = models.ForeignKey(TrainingSchedule, related_name='cancelled', verbose_name="Trening")
    date      = models.DateField('dzień odwołanych zajęć', default=timezone.now)

    class Meta:
        unique_together = (("schedule", "date"),)
        verbose_name = "odwołany trening"
        verbose_name_plural = "Odwołane treningi"

    def __str__(self):
        return "%s [%s]" % (str(self.schedule), self.date.strftime('%Y-%m-%d %H:%M'))


class Attendees(models.Model):
    ATTENDEE = 'ATTENDEE'
    SENSEI = 'SENSEI'
    ROLES = (
        (ATTENDEE, 'Uczestnik'),
        (SENSEI,   'Prowadzący'),
    )
    group          = models.ForeignKey(Groups, related_name='attendees', verbose_name="Grupa")
    first_name     = models.CharField('imię', max_length=100)
    last_name      = models.CharField('nawisko', max_length=100)
    has_sport_card = models.BooleanField('czy posiada kartę sportową', default=False)
    discount       = models.IntegerField('zniżka', blank=True, null=True, default=0)
    login          = models.CharField('login', max_length=100, unique=True)
    password       = models.CharField('hasło', max_length=100)
    role           = models.CharField('rola', max_length=10, choices=ROLES, default=ATTENDEE)
    active         = models.BooleanField('czy ćwiczy', default=True)

    class Meta:
        unique_together = (("group", "first_name", "last_name"),)
        verbose_name = "uczestnik"
        verbose_name_plural = "Uczestnicy"

    def __str__(self):
        return "%s %s (%s)" % (self.first_name, self.last_name, str(self.group))

    def get_monthly_fee(self):
        return self.group.monthly_fee - self.discount

    @staticmethod
    def hash_password(new_pass):
        # TODO:
        #     this is a very weak hash, we need to at least add user pk here,
        #     but this will require a couple more changes to the auth module
        hash_base = new_pass + settings.SECRET_KEY
        return hashlib.sha1( hash_base.encode('utf-8') ).hexdigest()

    def save(self, *args, **kwargs):
        if self._state.adding or self.password != self._loaded_values['password']:
            self.password = self.hash_password(self.password)
        super(Attendees, self).save(*args, **kwargs)


class Session(models.Model):
    secret    = models.CharField(max_length=15, blank=True)
    user      = models.ForeignKey(Attendees)
    timestamp = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if self._state.adding:
            shortuuid.set_alphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            self.secret = shortuuid.uuid()[:15]
        super(Session, self).save(*args, **kwargs)


    def bump(self):
        self.timestamp = timezone.now()
        self.save()

    def cookie_value(self):
        return "%s:%s" % (self.secret, self.pk)

    def __str__(self):
        return "for %s until %s" % (self.user, self.timestamp.strftime("%H:%M"))

    @staticmethod
    def extract_id(value):
        return value.split(':')[1]

    @staticmethod
    def getAndCheck(value):
        s = Session.objects.get(pk=Session.extract_id(value))
        if s.cookie_value() == value and s.timestamp + timedelta(minutes = 10) < timezone.now():
            raise Session.Invalid("Sesja wygasła")
        return s

    class Invalid(Exception):
        pass


class Attendance(models.Model):
    attendee        = models.ForeignKey(Attendees, related_name='attendance', verbose_name='Uczestnik')
    training        = models.ForeignKey(TrainingSchedule, related_name='attendance', verbose_name='Trening', null=True, blank=True)
    date            = models.DateField('dzień zajęć')
    added           = models.DateTimeField('czas rejestracji', default=timezone.now)
    used_sport_card = models.BooleanField('czy użył karty sportowej', default=False)

    class Meta:
        unique_together = ['attendee', 'training', 'date']
        verbose_name = "obecność"
        verbose_name_plural = "Obecności"

    def get_training_group_id(self):
        training_group_id = self.attendee.group.pk
        if self.training is not None and self.training.group is not None:
            training_group_id = self.training.group.pk

        return training_group_id

    def get_training_date(self):
        training_date = self.date.strftime('%Y-%m-%d')
        if self.training is not None:
            training_date += " " + self.training.begin_time.strftime('%H:%M')
        else:
            training_date += " " + self.added.strftime('%H:%M')
        return training_date

    def __str__(self):
        return "%s: %s" % (str(self.attendee), self.get_training_date())


class Payment(models.Model):
    CASH = 'CASH'
    TRANSFER = 'TRANSFER'
    TYPE = (
        (CASH,     'Gotówka'),
        (TRANSFER, 'Przelew'),
    )
    attendee     = models.ForeignKey(Attendees, related_name='payments', verbose_name='Uczestnik')
    type         = models.CharField('typ', max_length=10, choices=TYPE, default=CASH)
    amount       = models.IntegerField('kwota')
    date         = models.DateTimeField('czas zajęć', default=timezone.now)
    tax_reported = models.BooleanField('zarejestrowane w kasie', default=False)

    class Meta:
        verbose_name = "płatność"
        verbose_name_plural = "Płatności"

    def __str__(self):
        return "%s, %s: %s zł [%s]" % (str(self.attendee), self.date.strftime('%Y-%m-%d %H:%M'), str(self.amount), str(self.get_type_display()))


class MonthlyBalance(models.Model):
    attendee  = models.ForeignKey(Attendees, related_name='balance', verbose_name='Uczestnik')
    year      = models.IntegerField('rok')
    month     = models.IntegerField('miesiąc')
    amount    = models.IntegerField('bilans')

    class Meta:
        unique_together = (("attendee", "year", "month"),)
        verbose_name = "stan konta"
        verbose_name_plural = "Bilans"

    def __str__(self):
        return "%s %s-%s: %s zł" % (str(self.attendee), str(self.year), str(self.month), str(self.amount))
