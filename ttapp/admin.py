from django.contrib import admin
from django import forms
from ttapp.models import Groups, TrainingSchedule, Attendees, TrainingMonth
from django.db import models

import datetime

class TrainingScheduleInline(admin.TabularInline):
    model = TrainingSchedule
    extra = 0
    ordering = ('dow', )

class GroupsAdmin(admin.ModelAdmin):
    list_display = ('name', 'monthly_fee')
    list_filter = ['name', 'monthly_fee']
    search_fields = ['name', 'monthly_fee']
    ordering = ('monthly_fee', )
    inlines = [TrainingScheduleInline]

class AttendeesAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'assigned_pin', 'has_sport_card')
    list_filter = ['group', 'has_sport_card']
    search_fields = ['first_name', 'last_name']
    ordering = ('last_name', 'first_name')

# class TrainingMonthModelForm(forms.ModelForm):
#
#     class Meta:
#         model = TrainingMonth
#         fields = ('group', 'year', 'month', 'day_count')
#
#     def __init__(self, *args, **kwargs):
#         super(TrainingMonth, self).__init__(*args, **kwargs)
#         self.fields['day_count'].initial = 999


class TrainingMonthAdmin(admin.ModelAdmin):
    model = TrainingMonth
    fields = ('group', 'year', 'month', 'day_count')
    list_display = ['__str__', 'group', 'day_count', ]

    def save_model(self, request, obj, form, change):
        if obj.day_count == 0:
            obj.day_count = self.calc_day_count(obj)
        obj.save()

    def calc_day_count(self, obj):
        trainingSchedules = TrainingSchedule.objects.filter(group=obj.group).values('dow').values_list('dow', flat=True)
        holidays = [datetime.date(2017, 12, 25)] # you can add more here
        training_count = 0
        for i in range(1, 32):
            try:
                thisdate = datetime.date(obj.year, obj.month, i)
            except(ValueError):
                break
            if thisdate.weekday() in trainingSchedules and thisdate not in holidays:  # Monday == 0, Sunday == 6
                training_count += 1
        return training_count

admin.site.register(Groups, GroupsAdmin)
admin.site.register(Attendees, AttendeesAdmin)
admin.site.register(TrainingMonth, TrainingMonthAdmin)
