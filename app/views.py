from django.shortcuts import loader, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.template import RequestContext, Context
from django.contrib.auth import authenticate, login, logout
from urllib.request import urlopen, quote
from django.template.context_processors import csrf
from django.contrib.auth.decorators import login_required
from django.core import serializers

import json
import logging


from app.models import Message
from app.models import Issue
from app.models import MessageVote

# Create your views here.


def index(request):
    t = loader.get_template('index.html')
    c = RequestContext(request)
    if request is not None:
        c['request'] = request
    c.update(csrf(request))
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


def categories(request):
    url = 'http://dev.hel.fi:80/paatokset/v1/category/?level=0'
    return JsonResponse(get_url_as_json(url))


def issue(request, issueID):
    t = loader.get_template('issue.html')
    messages = Message.objects.filter(issue=issueID)
    url = 'http://dev.hel.fi/paatokset/v1/issue/%s/?format=json' % issueID
    details = get_url_as_json(url)
    c = Context({'message_list': messages, 'issueID': issueID, 'user': request.user, 'jsondetails': details})
    c.update(csrf(request))
    return HttpResponse(t.render(c))


def edit_message(request, messageID):
    if request.user is None or request.user.is_anonymous():
        return HttpResponseForbidden()
    if request.method == 'PUT':
        message = get_object_or_404(Message, poster=request.user, id=messageID)
        message.text = request.PUT['messagefield']
        message.save()
        return JsonResponse(message)
        return JsonResponse(message)
    elif request.method == 'DELETE':
        message = get_object_or_404(Message, poster=request.user, id=messageID)
        message.delete()
        return HttpResponse('Deleted')
    else:
        return HttpResponseBadRequest('Only PUT and DELETE methods are allowed')


@login_required
def post_message(request, issueID):
    if request.method == 'GET':
        messages = Message.objects.filter(issue=issueID)
        response = {}
        response['messages'] = [];
        votes = MessageVote.objects.filter(user=request.user);
        for m in messages:
            voted = votes.filter(message=m).count() > 0
            response['messages'].append({'text': m.text, 'poster': m.poster.username, 'created':m.created, 'edited':m.edited, 'id': m.id, 'liked': voted})
        return JsonResponse(response)
    elif request.user is None or request.user.is_anonymous():
        return HttpResponseForbidden('Please login before posting')
    elif request.method == 'POST':
        #create new issue to the database if the one with id=issueID is not found
        #Issues are foreign keys for messages
        issue = Issue.objects.get_or_create(id=issueID, ahjo_id=issueID)
        if issue[1] is True:
            issue[0].save()
            logging.info("Created object with id %s" % issueID)

        m = Message(text=request.POST['messagefield'], poster=request.user, issue_id=issueID)
        #m.text = request.POST['messagefield']
        #m.poster = request.user
        #m.issue_id = issueID
        m.save()
        response = {'text': m.text, 'poster': m.poster.username, 'created':m.created, 'edited':m.edited, 'id': m.id }
        return JsonResponse(response)
    else:
        return HttpResponseBadRequest("Only POST method is allowed")


@login_required
def vote_message(request, messageID):
    if request.method == 'POST':
        value = request.POST['value']
        value = min(int(value), 1)  # only +1 or 0 votes for now
        data = MessageVote.objects.get_or_create(user=request.user, message_id=messageID, vote_value=value)
        vote = data[0];
        vote.save();
        return JsonResponse({'messageId': vote.message.id, 'user': vote.user.username, 'value': vote.vote_value})

    elif request.method == 'DELETE':
        vote = get_object_or_404(MessageVote, user=request.user, message_id=messageID)
        vote.delete()
        return JsonResponse({'commentId': vote.id})

