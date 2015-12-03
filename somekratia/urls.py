"""somekratia URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
from app.views import index, login_view, issues_bbox, logout_view, subscribe_issue
from app.views import issue
from app.views import issues_search_text, issues_category
from app.views import post_message, edit_message
from app.views import categories
from app.views import vote_message
from app.views import issues_with_messages
from app.views import decisions



urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'ndex.html', index),
    url(r'^$', index),
    url(r'^login', login_view),
    url(r'^logout', logout_view),
    url(r'^issues/area$', issues_bbox),
    url(r'^issues/text/$', issues_search_text),
    url(r'^issues/category/(?P<category_id>[0-9]+)/$', issues_category),
    url(r'^$', index),
    url(r'^issue/(?P<issueID>[0-9]+)/$', issue),
    url(r'^issue/(?P<issueID>[0-9]+)/messages/$', post_message),
    url(r'^categories/', categories),
    url(r'^message/(?P<messageID>[0-9]+)/$', edit_message),
    url(r'^message/(?P<messageID>[0-9]+)/vote$', vote_message),
    url(r'^issues/recent/comments', issues_with_messages),
    url(r'^issue/(?P<issueID>[0-9]+)/decisions', decisions),
    url(r'^issue/(?P<issueID>[0-9]+)/subscribe', subscribe_issue),
]
