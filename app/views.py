from django.shortcuts import loader, redirect
from django.http import HttpResponse, JsonResponse
from django.template import RequestContext, Context
from django.contrib.auth import authenticate, login, logout
from urllib.request import urlopen, quote
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


def get_paging_info(request):
    page = request.GET.get('page')
    page_size = request.GET.get('pageSize')
    if page is None or page_size is None:
        return ""
    else:
        return "&page=%s&limit=%s" % (page, page_size)


def get_url_as_string(url):
    json_str = urlopen(url).read().decode('utf-8')
    return json_str


def get_url_as_json(url):
    return json.loads(get_url_as_string(url))


def issues_bbox(request):
    minLat = request.GET.get('minLat')
    maxLat = request.GET.get('maxLat')
    minLong = request.GET.get('minLong')
    maxLong = request.GET.get('maxLong')
    url = 'http://dev.hel.fi/paatokset/v1/issue/search/?bbox=%s,%s,%s,%s%s'\
          % (minLong, minLat, maxLong, maxLat, get_paging_info(request))
    return JsonResponse(get_url_as_json(url))


def issues_search_text(request):
    text = request.GET.get('search')
    if text is None or len(text) < 4:
        return HttpResponse('{ \'msg\' : \'Search term must be at least 4 characters long\' }', 400)
    url = 'http://dev.hel.fi/openahjo/v1/issue/search/?text=%s&format=json%s'\
          % (quote(text), get_paging_info(request))
    return JsonResponse(get_url_as_json(url))


def issues_category(request, category_id):
    url = 'http://dev.hel.fi/openahjo/v1/issue/search/?category=%d&format=json%s'\
          % (int(category_id), get_paging_info(request))
    return JsonResponse(get_url_as_json(url))


def categories(request, text):
    url = 'http://dev.hel.fi:80/paatokset/v1/category/?level=0'
    return HttpResponse(get_url_as_json(url))


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


