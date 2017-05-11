from django.contrib import admin
from django import forms
from datetime import datetime
from django.db.models import Q
from ttapp.models import Groups, TrainingSchedule, Attendees, CancelledTrainings, MonthlyBalance, Payment, Attendance


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
    list_display = ('__str__', 'login', 'has_sport_card', 'role', 'active', 'exam', 'seminar')
    list_filter = ['group', 'has_sport_card', 'active']
    search_fields = ['first_name', 'last_name']
    ordering = ('last_name', 'first_name')


class CancelledTrainingsForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(CancelledTrainingsForm, self).__init__(*args, **kwargs)
        attrs = {}
        today = datetime.today()
        self.fields['schedule'].queryset = TrainingSchedule.objects.filter(
            Q(stop_date__isnull=True) | Q(stop_date=today) | Q(stop_date__gt=today)
        )


class CancelledTrainingsAdmin(admin.ModelAdmin):
    form = CancelledTrainingsForm
    model = CancelledTrainings
    list_display = ('schedule', 'date')
    list_filter = ['date']
    ordering = ('-date',)


class PaymentAdmin(admin.ModelAdmin):
    list_display = ('attendee', 'date', 'type', 'amount', 'tax_reported')
    list_filter = ['type', 'tax_reported']
    search_fields = ['attendee']
    ordering = ('-date', 'type')


admin.site.register(Groups, GroupsAdmin)
admin.site.register(Attendees, AttendeesAdmin)
admin.site.register(CancelledTrainings, CancelledTrainingsAdmin)
admin.site.register(Payment, PaymentAdmin)

admin.site.register(MonthlyBalance)
admin.site.register(Attendance)