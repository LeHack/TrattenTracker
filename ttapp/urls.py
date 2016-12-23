from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^groups$', views.list_groups, name='list_groups'),
    url(r'^attendees$', views.list_attendees, name='list_attendees'),
    url(r'^schedules$', views.list_schedules, name='list_schedules'),
    url(r'^training_days_count/(?P<group_id>[0-9]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.get_training_days_count, name='get_training_days_count'),
    url(r'^attendance/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.list_attendance, name='list_attendance'),
    url(r'^payments/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)$', views.list_payments, name='list_payments'),
    url(r'^balance/(?P<attendee_id>[0-9]+)$', views.get_last_balance, name='get_last_balance')
]
