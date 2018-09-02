from django.db import models
from Crypto.Cipher import AES
import base64
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist
from django.utils.deconstruct import deconstructible
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
    description = models.TextField(blank=True)
    update_log = models.TextField(blank=True)
    date = models.DateField(auto_now=True)
    file = models.FileField(upload_to=RenameUploads('download/'))
    file_type = models.CharField(max_length=100, default='公开')


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200, default='未设定')
    level = models.IntegerField(default=0)
    area = models.CharField(max_length=200, default='未指定')
    school = models.CharField(max_length=200, default='未指定')
    department = models.CharField(max_length=200, default='未指定')
    relations = models.ManyToManyField('self', blank=True)

    def __str__(self):
        return self.user.username

    @property
    def role(self):
        roles = ['超级用户', '系统管理员', '校园管理员', '题库编辑', '教师', '学生']
        return roles[self.level]


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class Grader(models.Model):
    username = models.OneToOneField(Profile, on_delete=models.CASCADE, blank=True)
    plan = models.IntegerField()
    date_expire = models.DateField()

    @property
    def plan_detail(self):
        if self.plan <= 0:
            return '无计划'
        date_expire = ' - 于{}年{}月{}日过期'.format(self.date_expire.year, self.date_expire.month, self.date_expire.day)
        if self.plan % 12 == 0:
            return '{}年'.format(self.plan // 12) + date_expire
        return '{}个月'.format(self.plan) + date_expire

    @property
    def enc_key(self):
        def _pad(s):
            padding = AES.block_size - len(s) % AES.block_size
            return s + (padding * chr(padding)).encode()

        year = self.date_expire.year
        month = self.date_expire.month
        day = self.date_expire.day
        text = 'WXGR{}{:0>2}{:0>2}'.format(year, month, day, str(self.username))
        password = '{:.16}'.format(str(self.username))
        if len(password) < 16:
            password += '0' * (16 - len(password))
        iv = password
        cipher = AES.new(password, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(_pad(text.encode()))
        encrypted_key = base64.b64encode(encrypted).decode()
        return encrypted_key
