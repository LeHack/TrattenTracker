from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings

# devel urls
urlpatterns = []
if settings.DEBUG:
    urlpatterns.append( url(r'^rest/', include('ttapp.urls', namespace='rest')) )
    urlpatterns.append( url(r'^admin/', admin.site.urls) )
# production urls are little bit different when run from apache
else:
    urlpatterns.append( url(r'^manage/', admin.site.urls) )
    urlpatterns.append( url(r'^', include('ttapp.urls', namespace='rest')) )
