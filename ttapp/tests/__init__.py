from django.utils import timezone
from ttapp.models import Session


def update_latest_session(timestamp=None):
    s = Session.objects.first()
    s.timestamp = timestamp if timestamp is not None else timezone.now()
    s.save()
