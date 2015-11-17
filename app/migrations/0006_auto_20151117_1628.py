# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.utils.timezone import utc
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_auto_20151103_1216'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='created',
            field=models.DateTimeField(auto_now_add=True, default=datetime.datetime(2015, 11, 17, 16, 28, 43, 871929, tzinfo=utc)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='message',
            name='edited',
            field=models.DateTimeField(auto_now=True, default=datetime.datetime(2015, 11, 17, 16, 28, 50, 666444, tzinfo=utc)),
            preserve_default=False,
        ),
    ]
