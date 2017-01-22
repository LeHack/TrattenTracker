from datetime import datetime, timedelta
from .models import Attendees, Session


class Auth:
    session  = None

    def __init__(self, login=None, password=None, request=None):
        if login and password:
            try:
                a = Attendees.objects.get(login=login, password=Attendees.hash_password(password))
                self.session = Session(user = a)
                self.session.save()
            except Attendees.DoesNotExist:
                raise Auth.BadCredentials("Nieprawidłowy login lub hasło. Proszę spróbować ponownie lub skontaktować się z administratorem.")
        elif request:
            cookie = request.COOKIES.get('_session')
            if cookie:
                try:
                    self.session = Session.getAndCheck(cookie)
                except (Session.DoesNotExist, Session.Invalid):
                    raise Auth.BadCookie("Nie udało się odzyskać stanu sesji. Proszę zalogować się ponownie lub skontaktować się z administratorem.")

        if not self.session:
            raise Auth.BadCredentials("Nieprawidłowy login lub hasło. Proszę spróbować ponownie lub skontaktować się z administratorem.")

    def logout(self):
        if self.session:
            self.session.delete()
            self.session = None

    def set_cookie(self, response):
        if not self.session:
            raise Auth.BadCookie("Nie udało się odzyskać stanu sesji. Proszę zalogować się ponownie lub skontaktować się z administratorem.")

        self.session.bump()
        expires = datetime.strftime(datetime.utcnow() + timedelta(seconds=600), "%a, %d-%b-%Y %H:%M:%S GMT")
        response.set_cookie('_session', self.session.cookie_value(), max_age='14400', expires=expires)
        return response

    def __str__(self):
        return "Session: " + str(self.session)

    def as_response(self):
        user = self.session.user
        return {
            "logged in": True,
            "attendee_id": user.pk,
            "sport_card": user.has_sport_card,
            "name": "%s %s" % (user.first_name, user.last_name),
            "role": user.role,
        }


    class BadCredentials(Exception):
        pass


    class BadCookie(Exception):
        pass
