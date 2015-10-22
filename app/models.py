from django.db import models
from django.conf import settings
# Create your models here.


class Issue(models.Model):
    title = models.TextField()


class Thread(models.Model):
    issue = models.ForeignKey(Issue)


class Message(models.Model):
    text = models.TextField()
    poster = models.ForeignKey(settings.AUTH_USER_MODEL)
    reply_to = models.ForeignKey('self', blank=True, null=True)
    issue = models.ForeignKey(Thread)






