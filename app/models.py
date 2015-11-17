from django.db import models
from django.conf import settings
# Create your models here.


class UserWithProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    description = models.TextField()
    picture = models.ImageField(upload_to='image_uploads', null=True, blank=True)


class Issue(models.Model):
    title = models.TextField()
    ahjo_id = models.BigIntegerField(unique=True, blank=False, null=False)


class Decision(models.Model):
    title = models.TextField()
    ahjo_id = models.BigIntegerField(unique=True, blank=False, null=False)
    issue_id = models.ForeignKey(Issue)


class Message(models.Model):
    text = models.TextField()
    poster = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reply_to = models.ForeignKey('self', blank=True, null=True)
    issue = models.ForeignKey(Issue)
    created = models.DateTimeField(auto_now_add=True)
    edited = models.DateTimeField(auto_now=True)


class Subscriptions(models.Model):
    subscriber = models.ForeignKey(settings.AUTH_USER_MODEL)
    issue = models.ForeignKey(Issue)
