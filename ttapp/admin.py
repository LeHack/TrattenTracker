from django.contrib import admin
from ttapp.models import Groups, TrainingSchedule, Attendees, CancelledTrainings


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

class CancelledTrainingsAdmin(admin.ModelAdmin):
    model = CancelledTrainings
    list_display = ('schedule', 'date')
    list_filter = ['date']
    ordering = ('date',)

admin.site.register(Groups, GroupsAdmin)
admin.site.register(Attendees, AttendeesAdmin)
admin.site.register(CancelledTrainings, CancelledTrainingsAdmin)
