from django.utils import timezone
from ttapp.models import Session


def update_latest_session():
    s = Session.objects.first()
    s.timestamp = timezone.now()
    s.save()
