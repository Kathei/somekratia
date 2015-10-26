from django.shortcuts import loader, redirect
from django.http import HttpResponse
from django.template import Context
from django.contrib.auth import authenticate, login
from urllib.request import urlopen, HTTPError
import json

# Create your views here.


def index(request):
    t = loader.get_template('index.html')
    c = Context()
    return HttpResponse(t.render(c))


def login_view(request):
    if request.method != 'POST':
        return HttpResponse('Only POST is accepted', status=405)
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            login(request, user)
            return HttpResponse('Logged in')
        else:
            return HttpResponse('Account no longer active')
    else:
        return HttpResponse('Invalid password or username', status=403)


def issues_bbox(request):
    minLat = request.GET.get('minLat')
    maxLat = request.GET.get('maxLat')
    minLong = request.GET.get('minLong')
    maxLong = request.GET.get('maxLong')
    params = 'bbox=%s,%s,%s,%s' % (minLong, minLat, maxLong, maxLat)
    jsonurl = urlopen('http://dev.hel.fi/paatokset/v1/issue/search/?' + params)
    json_text = jsonurl.read().decode('utf-8')
    return HttpResponse(json_text)







