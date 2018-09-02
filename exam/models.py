from django.db import models
from django.contrib.postgres import fields


# Create your models here.
class Strategy(models.Model):
    category = models.ForeignKey('pool.Category', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    index = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    timer = models.IntegerField(default=100)
    plan = fields.JSONField(null=True)


class Exam(models.Model):
    title = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    section = models.CharField(max_length=100)
    date = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now=True)
    strategy_detail = fields.JSONField()


class ExamVerification(models.Model):
    project = models.CharField(max_length=100)
    verified = models.CharField(max_length=100)
    school = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)


class StudentList(models.Model):
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE)
    student_list = fields.JSONField()
