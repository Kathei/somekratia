from django.shortcuts import loader, redirect
from django.http import HttpResponse
from django.template import RequestContext, Context
from django.contrib.auth import authenticate, login, logout
from urllib.request import urlopen
from django.template.context_processors import csrf

import json

from app.models import Message
# Create your views here.


def index(request):
    t = loader.get_template('index.html')
    c = RequestContext(request)
    if request is not None:
        c['request'] = request
    c.update(csrf(request))
    return HttpResponse(t.render(c), request)


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


def logout_view(request):
    logout(request)
    return HttpResponse('Logged out')


def issues_bbox(request):
    minLat = request.GET.get('minLat')
    maxLat = request.GET.get('maxLat')
    minLong = request.GET.get('minLong')
    maxLong = request.GET.get('maxLong')
    params = 'bbox=%s,%s,%s,%s' % (minLong, minLat, maxLong, maxLat)
    jsonurl = urlopen('http://dev.hel.fi/paatokset/v1/issue/search/?' + params)
    json_text = jsonurl.read().decode('utf-8')
    return HttpResponse(json_text)







def issue(request, issueID):
    t = loader.get_template('issue.html')
    messages = Message.objects.filter(issue=issueID)
    c = Context( {'message_list': messages, 'issueID': issueID})
    c.update(csrf(request))
    return HttpResponse(t.render(c))


def post_message(request, issueID):
    if request.user is not None:
        m = Message()
        m.text = request.POST['messagefield']
        m.poster = request.user
        m.issue_id = issueID
        m.save()
        return HttpResponse('Message posted')
    else:
        return HttpResponse('Please login before posting', status=403)



