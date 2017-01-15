from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^groups$', views.list_groups, name='list_groups'),
    url(r'^attendees$', views.list_attendees, name='list_attendees'),
    url(r'^attendees/group/(?P<group_id>[0-9]+)$', views.list_attendees, name='list_attendees_by_group'),
    url(r'^trainings$', views.list_trainings, name='list_current_month_trainings'),
    url(r'^trainings/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.list_trainings, name='list_trainings'),
    url(r'^attendance$', views.update_attendance, name='update_attendance'),
    url(r'^attendance/(?P<date>[0-9\-]+)/(?P<time>[0-9:]+)$', views.list_attendance, name='list_attendance'),
    url(r'^attendance/(?P<attendee_id>[0-9]+)/(?P<date>[0-9\-]+)/(?P<time>[0-9:]+)$', views.list_attendance, name='list_attendance_single'),
    url(r'^attendance/group/summary/(?P<group_id>[0-9]+)$', views.attendance_summary, name='attendance_summary_6months'),
    url(r'^attendance/attendee/summary/(?P<attendee_id>[0-9]+)$', views.attendance_summary, name='group_attendance_summary_6months'),
    url(r'^attendance/attendee/split-summary/(?P<attendee_id>[0-9]+)$', views.attendance_summary, {'split_by_month': True}, name='attendance_summary_6months_split_by_month'),
    url(r'^attendance/attendee/summary/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)/(?P<month>[0-9]+)$', views.attendance_summary, name='attendance_summary_year_month'),
    url(r'^payments/(?P<attendee_id>[0-9]+)/(?P<year>[0-9]+)$', views.list_payments, name='list_payments'),
    url(r'^outstanding/attendee/(?P<attendee_id>[0-9]+)$', views.get_current_outstanding, name='get_current_outstanding'),
    url(r'^outstanding/group/(?P<group_id>[0-9]+)$', views.get_current_outstanding, name='get_current_group_outstanding'),
    url(r'^session$', views.get_session_status, name='get_session_status')
]
