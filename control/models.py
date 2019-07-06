from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.deconstruct import deconstructible
from django.contrib.postgres import fields
import uuid


@deconstructible
class RenameUploads(object):
    def __init__(self, path):
        self.sub_path = path

    def __call__(self, instance, filename):
        filename_as_list = filename.split('.')
        filename_as_list[0] = str(uuid.uuid4().hex)
        filename = '.'.join(filename_as_list)
        return self.sub_path + filename


# Create your models here.


class Download(models.Model):
    name = models.CharField(max_length=100)
    version = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    update_log = models.TextField(blank=True)
    date = models.DateField(auto_now=True)
    file = models.FileField(upload_to=RenameUploads('download/'))
    file_type = models.CharField(max_length=100, default='公开')


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200, default='未设定')
    area = models.CharField(max_length=200, default='未指定')
    school = models.CharField(max_length=200, default='未指定')
    department = models.CharField(max_length=200, default='未指定')
    relations = models.ManyToManyField('self', blank=True)
    access = fields.JSONField(default=dict)

    def __str__(self):
        return self.user.username

    @property
    def view_access(self):
        return dict(
            pool=self.access.get('view_pool', False) or self.user.is_superuser,
            exam=self.access.get('view_exam', False) or self.user.is_superuser,
            certification=self.access.get('view_certification', False) or self.user.is_superuser,
            download=self.access.get('view_download', False) or self.user.is_superuser,
        )


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()