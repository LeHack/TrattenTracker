from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^groups$', views.list_groups, name='list_groups'),
    url(r'^attendees$', views.list_attendees, name='list_attendees'),
    url(r'^attendees/group/(?P<group_id>[0-9]+)$', views.list_attendees, name='list_attendees_by_group'),
    url(r'^trainings/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.list_trainings, name='list_trainings'),
    url(r'^attendance/(?P<attendee_id>[0-9]+)$', views.list_attendance, name='list_attendance_all'),
    url(r'^attendance/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)$', views.list_attendance, name='list_attendance_year'),
    url(r'^attendance/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.list_attendance, name='list_attendance_year_month'),
    url(r'^attendance/group/summary/(?P<group_id>[0-9]+)$', views.attendance_summary, name='attendance_summary_6months'),
    url(r'^attendance/attendee/summary/(?P<attendee_id>[0-9]+)$', views.attendance_summary, name='group_attendance_summary_6months'),
    url(r'^attendance/attendee/summary/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.attendance_summary, name='attendance_summary_year_month'),
    url(r'^payments/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)$', views.list_payments, name='list_payments'),
    url(r'^balance/(?P<attendee_id>[0-9]+)$', views.get_last_balance, name='get_last_balance'),
    url(r'^session$', views.get_session_status, name='get_session_status')
]
