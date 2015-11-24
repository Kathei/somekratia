# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '0006_require_contenttypes_0002'),
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Decision',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('title', models.TextField()),
                ('ahjo_id', models.BigIntegerField(unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Issue',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('title', models.TextField()),
                ('ahjo_id', models.BigIntegerField(unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('text', models.TextField()),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('edited', models.DateTimeField(auto_now=True)),
                ('issue', models.ForeignKey(to='app.Issue')),
            ],
        ),
        migrations.CreateModel(
            name='MessageVote',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('vote_value', models.IntegerField()),
                ('message', models.ForeignKey(to='app.Message')),
            ],
        ),
        migrations.CreateModel(
            name='Subscriptions',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('issue', models.ForeignKey(to='app.Issue')),
            ],
        ),
        migrations.CreateModel(
            name='UserWithProfile',
            fields=[
                ('user', models.OneToOneField(primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL)),
                ('description', models.TextField()),
                ('picture', models.ImageField(blank=True, null=True, upload_to='image_uploads')),
            ],
        ),
        migrations.AddField(
            model_name='subscriptions',
            name='subscriber',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='messagevote',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='message',
            name='poster',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='message',
            name='reply_to',
            field=models.ForeignKey(blank=True, null=True, to='app.Message'),
        ),
        migrations.AddField(
            model_name='decision',
            name='issue_id',
            field=models.ForeignKey(to='app.Issue'),
        ),
        migrations.AlterUniqueTogether(
            name='messagevote',
            unique_together=set([('message', 'user')]),
        ),
    ]
