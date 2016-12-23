from django.utils import timezone
from django.db import models
import calendar


class Groups(models.Model):
    name        = models.CharField('nazwa', max_length=100, unique=True)
    monthly_fee = models.IntegerField('kwota')

    class Meta:
        verbose_name = "grupa"
        verbose_name_plural = "grupy"

    def __str__(self):
        return self.name


class TrainingMonth(models.Model):
    group     = models.ForeignKey(Groups, related_name='training_months', verbose_name="Grupa")
    year      = models.IntegerField('rok')
    month     = models.IntegerField('miesiąc')
    day_count = models.IntegerField('liczba dni treningowych')

    class Meta:
        unique_together = (("group", "year", "month"),)
        verbose_name = "miesiąc treningowy"
        verbose_name_plural = "miesiące treningowe"

    def __str__(self):
        return "%s-%s" % (str(self.year), str(self.month))


class TrainingSchedule(models.Model):
    group               = models.ForeignKey(Groups, related_name='trainings', verbose_name="Grupa")
    dow                 = models.IntegerField('dzień tygodnia')
    begin_time          = models.TimeField('czas rozpoczęcia')
    end_time            = models.TimeField('czas zakończenia')
    sport_card_allowed  = models.BooleanField('czy karty sportowe są dozwolone', default=True)

    class Meta:
        unique_together = (("group", "dow", "begin_time"),)
        verbose_name = "trening"
        verbose_name_plural = "Grafik zajęć"

    def __str__(self):
        return "%s: %s - %s" % (
            calendar.day_name[self.dow],
            self.begin_time.strftime('%H:%M'),
            self.end_time.strftime('%H:%M')
        )


class Attendees(models.Model):
    group          = models.ForeignKey(Groups, related_name='attendees', verbose_name="Grupa")
    first_name     = models.CharField('imię', max_length=100)
    last_name      = models.CharField('nawisko', max_length=100)
    assigned_pin   = models.CharField('kod dostępu', max_length=10, blank=True, null=True)
    has_sport_card = models.BooleanField('czy posiada kartę sportową', default=False)

    class Meta:
        unique_together = (("group", "first_name", "last_name"),)
        verbose_name = "uczestnik"
        verbose_name_plural = "uczestnicy"

    def __str__(self):
        return "%s %s (%s)" % (self.first_name, self.last_name, str(self.group))


class Attendance(models.Model):
    attendee        = models.ForeignKey(Attendees, related_name='attendance', verbose_name='Uczestnik')
    training        = models.ForeignKey(TrainingSchedule, related_name='attendance', verbose_name='Trening', null=True, blank=True)
    date            = models.DateTimeField('czas zajęć', default=timezone.now)
    used_sport_card = models.BooleanField('czy użył karty sportowej', default=False)

    class Meta:
        verbose_name = "obecność"
        verbose_name_plural = "obecności"

    def get_training_group_id(self):
        training_group_id = self.attendee.group.pk
        if self.training is not None:
            training_group_id = self.training.group.pk

        return training_group_id

    def get_training_date(self):
        if self.training is not None:
            training_date = "%s %s" % (self.date.strftime('%Y-%m-%d'), self.training.begin_time.strftime('%H:%M'))
        else:
            training_date = self.date.strftime('%Y-%m-%d %H:%M')
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
        verbose_name_plural = "płatności"

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
        verbose_name_plural = "stany konta"

    def __str__(self):
        return "%s %s-%s: %s zł" % (str(self.attendee), str(self.year), str(self.month), str(self.amount))
