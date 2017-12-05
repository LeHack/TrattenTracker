#!/usr/bin/env python

from optparse import OptionParser
import sqlite3, sys

argv = sys.argv[1:]
parser = OptionParser()
parser.add_option("--src", dest="src", help="Name of the main school database")
parser.add_option("--dst", dest="dst", help="Name of the attendance tracker database")
(opts, args) = parser.parse_args(argv)

if not opts.src or not opts.dst:
    raise Exception("Missing src or dst, both must be set!")

# TODO, change the file paths to params
oldDB = sqlite3.connect(opts.src)
ttDB = sqlite3.connect(opts.dst)

src = oldDB.cursor()
dst = ttDB.cursor()

changes = False

groupMap = {
    '5': 1, # Początkująca
    '6': 2  # Zaawansowana
}

srcData = {}
for row in src.execute('SELECT imie, nazwisko, email, status, grupa FROM karatecy WHERE grupa IN (5,6)'):
    k = '%s_%s' % (row[0], row[1])
    srcData[k.lower()] = {
        'imie': row[0],
        'nazwisko': row[1],
        'email': row[2],
        'status': row[3],
        'grupa': row[4],
    }

dstData = {}
for row in dst.execute('SELECT id, first_name, last_name, active, email FROM ttapp_attendees WHERE role = "ATTENDEE"'):
    k = '%s_%s' % (row[1], row[2])
    dstData[k.lower()] = {
        'id':       row[0],
        'imie':     row[1],
        'nazwisko': row[2],
        'status':   row[3],
        'email':    row[4],
    }

for p in dstData:
    if p not in srcData:
        print('%s jest w tratten trackerze, ale nie ma go w starej bazie?' % p)
        continue

    status = str(srcData[p]['status'])
    if status != str(dstData[p]['status']):
        print('%s ma nowy status: %s (%s)' % (p, status, dstData[p]['status']))
        dstData[p]['status'] = status
        dstData[p]['email'] = srcData[p]['email']
        changes = True

for p in srcData:
    status = str(srcData[p]['status'])
    if status != '1':
        continue

    if p not in dstData:
        print('%s wymaga zmigrowania do tratten trackera' % p)
        dstData[p] = {
            'imie': srcData[p]['imie'],
            'nazwisko': srcData[p]['nazwisko'],
            'email': srcData[p]['email'],
            'status': status,
            'grupa': srcData[p]['grupa'],
        }
        changes = True
        continue

    if dstData[p]['email'] is None:
       dstData[p]['email'] = srcData[p]['email']
       changes = True

if changes:
    print('Zapisywanie zmian...', end='')
    for p in dstData.values():
        t = [p['imie'], p['nazwisko'], p['email'], p['status']]
        if 'id' not in p:
            login = p['imie'][0] + p['nazwisko']
            t.append(False)
            t.append(groupMap[ str(p['grupa']) ])
            t.append(0)
            t.append(login.lower())
            t.append('haslo-do-ustawienia')
            dst.execute('INSERT INTO ttapp_attendees (first_name, last_name, email, active, has_sport_card, group_id, discount, login, password, role, exam, extra, seminar) VALUES(?,?,?,?,?,?,?,?,?,"ATTENDEE",0,0,0)', t)
        else:
            t.append(p['id'])
            dst.execute('UPDATE ttapp_attendees SET first_name = ?, last_name = ?, email = ?, active = ? WHERE id = ?', t)
    ttDB.commit()
    print('OK')
