from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from pool.models import Category, Subject
from .models import *


# Create your views here.

def exams(request):
    context = {
        'all_categories': Category.objects.all().order_by('index'),
        'all_subjects': Subject.objects.all().order_by('index'),
        'all_strategies': Strategy.objects.all().order_by('index'),
    }
    if request.method == 'POST':
        if 'add_strategy' in request.POST:
            new_object = Strategy(
                subject_id=int(request.POST.get('strategy_subject')),
                name=request.POST.get('strategy_name'),
                index=request.POST.get('strategy_index'),
                description=request.POST.get('strategy_description'),
                timer=int(request.POST.get('strategy_timer')),
            )
            new_object.save()
        messages.success(request, '操作成功！')
        return redirect('exam:exams')
    return render(request, 'exam/exams.html', context)


# AJAX functions
def change_category(request, category_id):
    if category_id == 0:
        subjects = Subject.objects.all()
    else:
        selected_category = Category.objects.get(pk=category_id)
        subjects = Subject.objects.filter(category=selected_category)
    subjects = subjects.order_by('index')
    subject_list = []
    strategy_list = []
    for sub in subjects:
        subject_list.append((sub.id, str(sub)))
        strategies = Strategy.objects.filter(subject=sub).order_by('index')
        for st in strategies:
            strategy_list.append((st.id, str(st)))
    return JsonResponse({'subjects': subject_list, 'strategies': strategy_list})


def change_subject(request, category_id, subject_id):
    if subject_id == 0:
        return change_category(request, category_id)
    else:
        selected_subject = Subject.objects.get(pk=subject_id)
        chapters = Strategy.objects.filter(subject=selected_subject)
    strategies = chapters.order_by('index')
    strategy_list = []
    for st in strategies:
        strategy_list.append((st.id, str(st)))
    return JsonResponse({'chapters': strategy_list})
