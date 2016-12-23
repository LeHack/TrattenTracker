# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2016-12-23 20:54
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(default=django.utils.timezone.now, verbose_name='czas zajęć')),
                ('used_sport_card', models.BooleanField(default=False, verbose_name='czy użył karty sportowej')),
            ],
            options={
                'verbose_name_plural': 'obecności',
                'verbose_name': 'obecność',
            },
        ),
        migrations.CreateModel(
            name='Attendees',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=100, verbose_name='imię')),
                ('last_name', models.CharField(max_length=100, verbose_name='nawisko')),
                ('assigned_pin', models.CharField(blank=True, max_length=10, null=True, verbose_name='kod dostępu')),
                ('has_sport_card', models.BooleanField(default=False, verbose_name='czy posiada kartę sportową')),
            ],
            options={
                'verbose_name_plural': 'uczestnicy',
                'verbose_name': 'uczestnik',
            },
        ),
        migrations.CreateModel(
            name='Groups',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='nazwa')),
                ('monthly_fee', models.IntegerField(verbose_name='kwota')),
            ],
            options={
                'verbose_name_plural': 'grupy',
                'verbose_name': 'grupa',
            },
        ),
        migrations.CreateModel(
            name='MonthlyBalance',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(verbose_name='rok')),
                ('month', models.IntegerField(verbose_name='miesiąc')),
                ('amount', models.IntegerField(verbose_name='bilans')),
                ('attendee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='balance', to='ttapp.Attendees', verbose_name='Uczestnik')),
            ],
            options={
                'verbose_name_plural': 'stany konta',
                'verbose_name': 'stan konta',
            },
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('CASH', 'Gotówka'), ('TRANSFER', 'Przelew')], default='CASH', max_length=10, verbose_name='typ')),
                ('amount', models.IntegerField(verbose_name='kwota')),
                ('date', models.DateTimeField(default=django.utils.timezone.now, verbose_name='czas zajęć')),
                ('tax_reported', models.BooleanField(default=False, verbose_name='zarejestrowane w kasie')),
                ('attendee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='ttapp.Attendees', verbose_name='Uczestnik')),
            ],
            options={
                'verbose_name_plural': 'płatności',
                'verbose_name': 'płatność',
            },
        ),
        migrations.CreateModel(
            name='TrainingMonth',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(verbose_name='rok')),
                ('month', models.IntegerField(verbose_name='miesiąc')),
                ('day_count', models.IntegerField(verbose_name='liczba dni treningowych')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='training_months', to='ttapp.Groups', verbose_name='Grupa')),
            ],
            options={
                'verbose_name_plural': 'miesiące treningowe',
                'verbose_name': 'miesiąc treningowy',
            },
        ),
        migrations.CreateModel(
            name='TrainingSchedule',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dow', models.IntegerField(verbose_name='dzień tygodnia')),
                ('begin_time', models.TimeField(verbose_name='czas rozpoczęcia')),
                ('end_time', models.TimeField(verbose_name='czas zakończenia')),
                ('sport_card_allowed', models.BooleanField(default=True, verbose_name='czy karty sportowe są dozwolone')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trainings', to='ttapp.Groups', verbose_name='Grupa')),
            ],
            options={
                'verbose_name_plural': 'Grafik zajęć',
                'verbose_name': 'trening',
            },
        ),
        migrations.AddField(
            model_name='attendees',
            name='group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendees', to='ttapp.Groups', verbose_name='Grupa'),
        ),
        migrations.AddField(
            model_name='attendance',
            name='attendee',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance', to='ttapp.Attendees', verbose_name='Uczestnik'),
        ),
        migrations.AddField(
            model_name='attendance',
            name='training',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='attendance', to='ttapp.TrainingSchedule', verbose_name='Trening'),
        ),
        migrations.AlterUniqueTogether(
            name='trainingschedule',
            unique_together=set([('group', 'dow', 'begin_time')]),
        ),
        migrations.AlterUniqueTogether(
            name='trainingmonth',
            unique_together=set([('group', 'year', 'month')]),
        ),
        migrations.AlterUniqueTogether(
            name='monthlybalance',
            unique_together=set([('attendee', 'year', 'month')]),
        ),
        migrations.AlterUniqueTogether(
            name='attendees',
            unique_together=set([('group', 'first_name', 'last_name')]),
        ),
    ]
