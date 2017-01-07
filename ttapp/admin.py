from django.contrib import admin
from ttapp.models import Groups, TrainingSchedule

class TrainingScheduleInline(admin.TabularInline):
    model = TrainingSchedule
    extra = 0
    ordering = ('dow', )

class GroupsAdmin(admin.ModelAdmin):
    list_display = ('name', 'monthly_fee')
    list_filter = ['name', 'monthly_fee']
    search_fields = ['name', 'monthly_fee']
    inlines = [TrainingScheduleInline]

admin.site.register(Groups, GroupsAdmin)
