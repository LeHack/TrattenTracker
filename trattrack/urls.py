from django.conf.urls import include, url
from django.contrib import admin
from .settings import DEBUG

# devel urls
urlpatterns = [
    url(r'^rest/', include('ttapp.urls', namespace='rest')),
    url(r'^admin/', admin.site.urls),
]

# production urls are little bit different when run from apache
if not DEBUG:
    urlpatterns = [
        url(r'^manage/', admin.site.urls),
        url(r'^', include('ttapp.urls', namespace='rest')),
    ]
