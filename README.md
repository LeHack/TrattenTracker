# TrattenTracker
Training attendance tracker with the option to calculate attendance-based monthly fees and provide it online for all students.

Autorzy: Łukasz Hejnak, Piotr Skurski, Łukasz Malinowski

## Instalacja (za pierwszym razem, później kroki 3, 5, 8, 10, 11):
0. Upewnij się, że masz python3 (3.4.3) oraz pip 7.1.0 zainstalowany (i skonfigurowany by używał python3)
1. sudo pip install virtualenv
2. git clone git@github.com:LeHack/TrattenTracker
3. cd TrattenTracker
4. virtualenv .
5. source bin/activate
6. pip install Django==1.10.3 python-dateutil==2.6.0 shortuuid==0.4.3
7. dodaj nową domenę (np. trattentracker.pl) w /etc/hosts wskazującą na 127.0.0.100, np.
        sudo echo "127.0.0.100   trattentracker.pl" >> /etc/hosts
8. python manage.py migrate
9. npm install
10. npm run start
11. python manage.py runserver trattentracker.pl:8000
12. wejdź na trattentracker.pl:3000 (*3000* nie 8000!)
13. ???
14. profit $$$
