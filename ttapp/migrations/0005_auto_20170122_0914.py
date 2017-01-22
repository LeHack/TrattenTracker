# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2017-01-22 09:14
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('ttapp', '0004_auto_20170120_2137'),
    ]

    operations = [
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('secret', models.CharField(blank=True, max_length=15)),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.RemoveField(
            model_name='attendees',
            name='assigned_pin',
        ),
        migrations.AddField(
            model_name='attendees',
            name='active',
            field=models.BooleanField(default=True, verbose_name='czy ćwiczy'),
        ),
        migrations.AddField(
            model_name='attendees',
            name='login',
            field=models.CharField(default=1, max_length=100, unique=True, verbose_name='login'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='attendees',
            name='password',
            field=models.CharField(default=1, max_length=100, verbose_name='hasło'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='attendees',
            name='role',
            field=models.CharField(choices=[('ATTENDEE', 'Uczestnik'), ('SENSEI', 'Prowadzący')], default='ATTENDEE', max_length=10, verbose_name='rola'),
        ),
        migrations.AddField(
            model_name='session',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ttapp.Attendees'),
        ),
    ]
