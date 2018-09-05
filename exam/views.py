from django.shortcuts import render
from pool.models import Category
from .models import *

# Create your views here.

def exams(request):
    context = {
        'all_categories': Category.objects.all().order_by('index'),
        'all_strategies': Strategy.objects.all().order_by('index'),
    }
    return render(request, 'exam/exams.html', context)
