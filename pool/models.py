from django.db import models
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

class Catalog(models.Model):
    name = models.CharField(max_length=500)
    index = models.CharField(max_length=100)

    def __str__(self):
        return '{} - {}'.format(self.index, self.name)

    class Meta:
        abstract = True


class Category(Catalog):
    class Meta:
        abstract = False


class Subject(Catalog):
    category = models.ForeignKey('Category', on_delete=models.CASCADE)


class Chapter(Catalog):
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE)
    points = fields.ArrayField(models.IntegerField(), size=7)
    difficulties = fields.ArrayField(models.IntegerField(), size=7)
    image = models.ImageField(upload_to=RenameUploads('chapter/'), blank=True)


# ==========================================================================
# Question types
# --------------------------------------------------------------------------
# There are 8 main types of questions.
# ForeignKey: Chapter,
# ==========================================================================
class Problem(models.Model):
    chapter = models.ForeignKey('Chapter', on_delete=models.CASCADE)
    index = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to=RenameUploads('problem/'), blank=True)
    attachment = models.FileField(upload_to=RenameUploads('problem/'), blank=True)
    video = models.FileField(upload_to=RenameUploads('problem/'), blank=True)

    def __str__(self):
        return '{} {}'.format(self.index, self.description)

    class Meta:
        abstract = True


class CommonProblem(Problem):
    student_upload = models.BooleanField(default=False)
    chance = models.IntegerField(default=1)
    answer_image = models.ImageField(upload_to=RenameUploads('problem/'), blank=True)

    class Meta:
        abstract = True


class MultipleChoice(CommonProblem):
    choices = fields.ArrayField(models.CharField(max_length=200))
    answer = models.CharField(max_length=2)


class MultipleResponse(CommonProblem):
    choices = fields.ArrayField(models.CharField(max_length=200))
    answer = fields.ArrayField(models.CharField(max_length=2))


class TrueOrFalse(CommonProblem):
    answer = models.CharField(max_length=2)


class TextBlank(CommonProblem):
    answer = models.CharField(max_length=200)


class NumericBlank(CommonProblem):
    answer = models.FloatField()
    error = models.FloatField(default=0)


class Description(CommonProblem):
    answer = models.TextField(blank=True)
    need_answer = models.BooleanField(default=True)


class Comprehensive(Problem):
    class Meta:
        abstract = False


# ==========================================================================
# Comprehensive components
# --------------------------------------------------------------------------
# Comprehensive questions can consist of all the other 7 types.
# ForeignKey: Comprehensive,
# Order: IntegerField. Determine where it is in the set.
# Percentage: FloatField. How much it weighs in the set.
# ==========================================================================
class ComprehensiveProblem(models.Model):
    comprehensive = models.ForeignKey('Comprehensive', on_delete=models.CASCADE)
    order = models.IntegerField()
    percentage = models.FloatField()
    description = models.TextField()
    image = models.ImageField(upload_to=RenameUploads('problem/'), blank=True)
    video = models.FileField(upload_to=RenameUploads('problem/'), blank=True)
    student_upload = models.BooleanField(default=False)
    chance = models.IntegerField(default=1)
    answer_image = models.ImageField(upload_to=RenameUploads('problem/'), blank=True)

    def __str__(self):
        return '({}) {}'.format(self.order, self.description)

    class Meta:
        abstract = True


class SubMultipleChoice(ComprehensiveProblem):
    choices = fields.ArrayField(models.CharField(max_length=200))
    answer = models.CharField(max_length=2)


class SubMultipleResponse(ComprehensiveProblem):
    choices = fields.ArrayField(models.CharField(max_length=200))
    answer = fields.ArrayField(models.CharField(max_length=2))


class SubTrueOrFalse(ComprehensiveProblem):
    answer = models.CharField(max_length=2)


class SubTextBlank(ComprehensiveProblem):
    answer = models.CharField(max_length=200)


class SubNumericBlank(ComprehensiveProblem):
    answer = models.FloatField()
    error = models.FloatField(default=0)


class SubDescription(ComprehensiveProblem):
    answer = models.TextField(blank=True)
    need_answer = models.BooleanField(default=True)


# ==========================================================================
# Choice images
# ==========================================================================
class ChoiceImage(models.Model):
    image = models.ImageField(upload_to=RenameUploads('problem/'), blank=True)
    choice = models.CharField(max_length=2)

    class Meta:
        abstract = True


class MultipleChoiceImage(ChoiceImage):
    problem = models.ForeignKey(MultipleChoice, on_delete=models.CASCADE)


class MultipleResponseImage(ChoiceImage):
    problem = models.ForeignKey(MultipleResponse, on_delete=models.CASCADE)


class SubMultipleChoiceImage(ChoiceImage):
    problem = models.ForeignKey(SubMultipleChoice, on_delete=models.CASCADE)


class SubMultipleResponseImage(ChoiceImage):
    problem = models.ForeignKey(SubMultipleResponse, on_delete=models.CASCADE)
