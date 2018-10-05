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
