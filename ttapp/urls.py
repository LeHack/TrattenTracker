from django.conf.urls import include, url
from django.views.decorators.csrf import ensure_csrf_cookie
from . import views

urlpatterns = [
    url(r'^list/', include([
        url(r'^groups$', views.list_groups),
        url(r'^attendees$', views.list_attendees),
        url(r'^attendees/group:(?P<group_id>[0-9]+)$', views.list_attendees),
        url(r'^trainings/', include([
            url(r'^latest$', views.list_trainings),
            url(r'^year:(?P<year>[0-9]+)/month:(?P<month>[0-9-]+)$', views.list_trainings),
        ])),
        url(r'^attendance/', include([
            url(r'^attendee:(?P<attendee_id>[0-9]+)/month:(?P<month>[0-9-]+)$', views.list_attendance),
            url(r'^date:(?P<date>[0-9\-]+)/time:(?P<time>[0-9:]+)$', views.list_attendance),
        ])),
        url(r'^payments/attendee:(?P<attendee_id>[0-9]+)$', views.list_payments),
    ])),
    url(r'^summarize/', include([
        url(r'^attendance/', include([
            url(r'^group:(?P<group_id>[0-9]+)$', views.attendance_summary),
            url(r'^attendee:(?P<attendee_id>[0-9]+)/', include([
                url(r'^total$', views.attendance_summary),
                url(r'^monthly$', views.attendance_summary, {'split_by_month': True}),
            ])),
        ])),
        url(r'^payments/', include([
            url(r'^attendee:(?P<attendee_id>[0-9]+)$', views.get_current_outstanding),
            url(r'^group:(?P<group_id>[0-9]+)$', views.get_current_outstanding),
        ])),
    ])),
    url(r'^get/', include([
        url(r'^session$', ensure_csrf_cookie(views.get_session_status)),
        url(r'^fee/attendee:(?P<attendee_id>[0-9]+)$', views.get_monthly_fee),
    ])),
    url(r'^update/', include([
        url(r'^attendance$', views.update_attendance),
        url(r'^payments', views.update_payment),
    ])),
    url(r'^login$', views.login),
    url(r'^logout', views.logout),
]
