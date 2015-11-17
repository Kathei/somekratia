# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '0006_require_contenttypes_0002'),
        ('app', '0004_auto_20151022_1355'),
    ]

    operations = [
        migrations.CreateModel(
            name='Decision',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('title', models.TextField()),
                ('ahjo_id', models.BigIntegerField(unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Subscriptions',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
            ],
        ),
        migrations.CreateModel(
            name='UserWithProfile',
            fields=[
                ('user', models.OneToOneField(serialize=False, to=settings.AUTH_USER_MODEL, primary_key=True)),
                ('description', models.TextField()),
                ('picture', models.ImageField(null=True, upload_to='image_uploads', blank=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='thread',
            name='issue',
        ),
        migrations.AddField(
            model_name='issue',
            name='ahjo_id',
            field=models.BigIntegerField(unique=True, default=1),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='message',
            name='issue',
            field=models.ForeignKey(to='app.Issue'),
        ),
        migrations.DeleteModel(
            name='Thread',
        ),
        migrations.AddField(
            model_name='subscriptions',
            name='issue',
            field=models.ForeignKey(to='app.Issue'),
        ),
        migrations.AddField(
            model_name='subscriptions',
            name='subscriber',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='decision',
            name='issue_id',
            field=models.ForeignKey(to='app.Issue'),
        ),
    ]
