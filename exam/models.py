from django.db import models
from django.contrib.postgres import fields
from pool.models import RenameUploads


# Create your models here.
class Strategy(models.Model):
    subject = models.ForeignKey('pool.Subject', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    index = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    timer = models.IntegerField(default=100)
    plan = fields.JSONField(blank=True, null=True)
    created = models.DateTimeField(auto_now=True)

    def __str__(self):
        return '{} - {}'.format(self.index, self.name)


class Exam(models.Model):
    title = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    section = models.CharField(max_length=100)
    date = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now=True)
    strategy_detail = fields.JSONField()


class GovernmentCertification(models.Model):
    name = models.CharField(max_length=100, blank=True)
    project = models.CharField(max_length=100, blank=True)
    verified = models.CharField(max_length=100, blank=True)
    school = models.CharField(max_length=100, blank=True)
    subject = models.CharField(max_length=100, blank=True)
    student_list = fields.JSONField()
    created = models.DateTimeField(auto_now=True)

    def __str__(self):
        if not self.name:
            return '未命名认证包'
        return self.name


class StudentList(models.Model):
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True)
    student_list = fields.JSONField()
    created = models.DateTimeField(auto_now=True)


class Student(models.Model):
    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=100)
    photo = models.ImageField(upload_to=RenameUploads('student/'), blank=True)
