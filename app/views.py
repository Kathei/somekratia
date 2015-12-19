from django.shortcuts import loader, redirect, get_object_or_404, render_to_response
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
from django.http import HttpResponseRedirect
from django.template import RequestContext, Context
from django.contrib.auth import authenticate, login, logout
from urllib.request import urlopen, quote
from django.template.context_processors import csrf
from django.contrib.auth.decorators import login_required
from app.forms import UserForm, UserProfileForm
from django.core import serializers

import json
import logging


from app.models import Message, IssueSubscription
from app.models import Issue
from app.models import MessageVote
from app.models import Decision
from app.models import UserWithProfile

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
            return JsonResponse({"id": request.user.id, "name": request.user.username});
        else:
            return HttpResponse('Account no longer active')
    else:
        return HttpResponse('Invalid password or username', status=403)


def register(request):
    context = RequestContext(request)
    registered = False

    if request.method == 'POST':
        user_form = UserForm(data=request.POST)
        profile_form = UserProfileForm(data=request.POST)

        if user_form.is_valid() and profile_form.is_valid():
            user = user_form.save()
            user.set_password(user.password)
            user.save()

            profile = profile_form.save(commit=False)
            profile.user = user
            if 'picture' in request.FILES:
                profile.picture = request.FILES['picture']
            profile.save()
            registered = True
            return HttpResponseRedirect('/user/%d/' % profile.user_id)
        else:
            print(user_form.errors, profile_form.errors)
    else:
        user_form = UserForm()
        profile_form = UserProfileForm()

    return render_to_response(
            'register.html',
            {'user_form': user_form, 'profile_form': profile_form, 'registered': registered},
            context)


def current_user(request):
    if request.user.is_authenticated():
        userdata = {"id": request.user.id, "name": request.user.username}
        return JsonResponse(userdata)
    else:
        return HttpResponseForbidden

def user_picture(request, userID):
    user = get_object_or_404(UserWithProfile, user=userID)
    return HttpResponse(user.picture.file, content_type='text/plain')


def user_profile(request, userID):
    if request.user.is_authenticated():
        user = get_object_or_404(UserWithProfile, user=userID)
        return render_to_response('static/profile.html',
                           {'user': user},
                           RequestContext(request))
    else:
        return HttpResponseRedirect("/")


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
    minLat = float(request.GET.get('minLat')) - 0.005
    maxLat = float(request.GET.get('maxLat')) + 0.005
    minLong = float(request.GET.get('minLong')) - 0.005
    maxLong = float(request.GET.get('maxLong')) + 0.005
    category = request.GET.get('category')
    url = 'http://dev.hel.fi/paatokset/v1/issue/search/?bbox=%.2f,%.2f,%.2f,%.2f%s'\
          % (minLong, minLat, maxLong, maxLat, get_paging_info(request))
    if category is not None:
        url += ('&category=%s' % category)
    return JsonResponse(get_url_as_json(url))


def issues_search_text(request):
    text = request.GET.get('search')
    if text is None or len(text) < 4:
        return HttpResponse('{ "msg" : "Search term must be at least 4 characters long" }', 400)
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


def decisions(request, issueID):
    url = 'http://dev.hel.fi/paatokset/v1/agenda_item/?issue=%s' % issueID
    return JsonResponse(get_url_as_json(url))


def issue(request, issueID):
    url = 'http://dev.hel.fi/paatokset/v1/issue/%s/?format=json' % issueID
    details = get_url_as_json(url)
    subscribed = False
    if request.user.is_authenticated():
        subscribes = IssueSubscription.objects.filter(user=request.user, issue=issueID)
        if subscribes.count() > 0:
            subscribed = True
            details['subscribed'] = True
    issuedetails = {'issueID': issueID, 'user': {'id' : request.user.id, 'username': request.user.username}, 'jsondetails': details, 'subscribed':subscribed}
    return JsonResponse(issuedetails)


def messages(request, issueID):
    messages = Message.objects.filter(issue=issueID)
    messagelist = {}
    messagelist['messages'] = []
    for message in messages:
        messagelist['messages'].append({'message': message.message_json()})
        return JsonResponse(messagelist)


def issues_with_messages(request):
    messages = Message.objects.order_by('-edited')[:10]
    issuelist = {}
    issuelist['commented'] = []
    for message in messages:
        issue = message.issue
        poster = message.poster.username
        votes = MessageVote.objects.filter(message=message)
        votes_counted = votes.count()
        voted = False
        if request.user.is_authenticated():
            users_votes = votes.filter(user=request.user)
            if users_votes.count() > 0:
                voted = True
        issuelist['commented'].append({'message' : message.text, 'issueID' : issue.ahjo_id, 'votes': int(votes_counted), 'voted': bool(voted), 'poster': poster})
    return JsonResponse(issuelist)


def edit_message(request, messageID):
    if request.user is None or request.user.is_anonymous():
        return HttpResponseForbidden()
    if request.method == 'PUT':
        message = get_object_or_404(Message, poster=request.user, id=messageID)
        message.text = request.PUT['messagefield']
        message.save()
        return JsonResponse(message)
    elif request.method == 'DELETE':
        message = get_object_or_404(Message, poster=request.user, id=messageID)
        message.delete()
        return HttpResponse('Deleted')
    else:
        return HttpResponseBadRequest('Only PUT and DELETE methods are allowed')


def post_message(request, issueID):
    if request.method == 'GET':
        messages = Message.objects.filter(issue=issueID)
        response = {}
        response['messages'] = []
        if request.user.is_authenticated():
            votes = MessageVote.objects.filter(user=request.user)
        else:
            votes = None

        for m in messages:
            if votes is not None:
                voted = votes.filter(message=m).count() > 0
            else:
                voted = False
            response['messages'].append({'text': m.text, 'poster': m.poster.username, 'created':m.created, 'edited':m.edited, 'id': m.id, 'liked': voted})

        for m in messages:
            replies = Message.objects.filter(reply_to=m)
            response['messages'].append({'replies':replies})

        return JsonResponse(response)
    elif request.user is None or request.user.is_anonymous():
        return HttpResponseForbidden('Please login before posting')
    elif request.method == 'POST':
        issue = Issue.objects.get_or_create(id=issueID, ahjo_id=issueID)
        if issue[1] is True:
            issue[0].save()
            logging.info("Created object with id %s" % issueID)

        m = Message(text=request.POST['messagefield'], poster=request.user, issue_id=issueID)
        m.save()
        response = {'text': m.text, 'poster': m.poster.username, 'created':m.created, 'edited':m.edited, 'id': m.id }
        return JsonResponse(response)
    else:
        return HttpResponseBadRequest("Only POST and GET methods are allowed")


def reply_to_message(request, messageID):
    if request.method == 'POST':
        m = Message(text=request.POST['replyfield'], poster=request.user,
                    reply_to=get_object_or_404(Message, id=messageID),
                    issue_id=get_object_or_404(Message, id=messageID).issue.ahjo_id)
        m.save()
        response = {'text': m.text, 'poster': m.poster.username, 'created':m.created, 'edited':m.edited, 'id': m.id }
        return JsonResponse(response)


@login_required
def vote_message(request, messageID):
    if request.method == 'POST':
        value = request.POST['value']
        value = min(int(value), 1)  # only +1 or 0 votes for now
        data = MessageVote.objects.get_or_create(user=request.user, message_id=messageID, vote_value=value)
        vote = data[0]
        vote.save()
        return JsonResponse({'messageId': vote.message.id, 'user': vote.user.username, 'value': vote.vote_value})

    elif request.method == 'DELETE':
        vote = get_object_or_404(MessageVote, user=request.user, message_id=messageID)
        vote.delete()
        return JsonResponse({'commentId': vote.id})

@login_required
def subscribe_issue(request, issueID):

    if request.method == 'POST':
        issue = Issue.objects.get_or_create(id=issueID, ahjo_id=issueID)
        if issue[1] is True:
            issue[0].save()
            logging.info("Created object with id %s" % issueID)
        data = IssueSubscription.objects.get_or_create(user=request.user, issue_id=issueID)
        subscribe = data[0]
        subscribe.save()
        return JsonResponse({'issueId' : subscribe.issue.id, 'user' : subscribe.user.username})
    elif request.method == 'DELETE':
        subscribe = get_object_or_404(IssueSubscription, user = request.user, issue_id = issueID)
        subscribe.delete()
        return JsonResponse({'subId' : subscribe.id})


def get_issue_subscriptions(request):
    user = request.user
    list = {'subscriptions' : []}
    if user.is_authenticated():
        subscriptions = IssueSubscription.objects.filter(user=user)
        for subscription in subscriptions:
            list['subscriptions'].append(subscription.issue.ahjo_id)
    return JsonResponse(list)

