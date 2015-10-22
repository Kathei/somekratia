# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_auto_20151022_1352'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='reply_to',
            field=models.ForeignKey(to='app.Message', null=True, blank=True),
        ),
    ]
