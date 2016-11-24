'''
Created on 24.11.2016

@author: lehack
'''
from django.http import HttpResponse


def index(request):
    return HttpResponse("Welcome to the TrattenTracker index site.")
