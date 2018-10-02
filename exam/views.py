from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from pool.models import Category, Subject, Chapter
from .models import *
import json

# Create your views here.

type_sc_abbr = ('单选', '多选', '判断', '文填', '数填', '陈述', '综合')
type_sc_full = ('单项选择题', '多项选择题', '判断题', '文本填空题', '数字填空题', '陈述题', '综合题')


def exams(request):
    chapter_points = tuple(map(lambda num: 'point{}'.format(num), range(1, 8)))
    chapter_difficulties = tuple(map(lambda num: 'difficulty{}'.format(num), range(1, 8)))
    chapter_q_nums = tuple(map(lambda num: 'q_num{}'.format(num), range(1, 8)))
    context = {
        'all_categories': Category.objects.all().order_by('index'),
        'all_subjects': Subject.objects.all().order_by('index'),
        'all_chapters': Chapter.objects.all().order_by('index'),
        'all_strategies': Strategy.objects.all().order_by('index'),
        'type_sc_abbr': type_sc_abbr,
        'chapter_info': tuple(zip(type_sc_full, chapter_points, chapter_difficulties, chapter_q_nums)),
    }
    if request.method == 'POST':
        if 'add_strategy' in request.POST:
            new_object = Strategy(
                subject_id=int(request.POST.get('strategy_subject')),
                name=request.POST.get('strategy_name'),
                index=request.POST.get('strategy_index'),
            )
            new_object.description = request.POST.get('strategy_description')
            if request.POST.get('strategy_timer'):
                new_object.timer = int(request.POST.get('strategy_timer'))
            new_object.save()
        elif 'strategy_plan' in request.POST:
            this_object = Strategy.objects.get(id=int(request.POST.get('selected_strategy')))
            plan = json.loads(request.POST.get('strategy_plan'))
            this_object.plan = plan
            this_object.save()
        elif 'edit_strategy' in request.POST or 'duplicate_strategy' in request.POST:
            this_object = Strategy.objects.get(id=int(request.POST.get('strategy_id')))
            this_object.subject_id = int(request.POST.get('strategy_subject'))
            this_object.name = request.POST.get('strategy_name')
            this_object.index = request.POST.get('strategy_index')
            this_object.description = request.POST.get('strategy_description')
            if request.POST.get('strategy_timer'):
                this_object.timer = int(request.POST.get('strategy_timer'))
            else:
                this_object.timer = 100
            if 'duplicate_strategy' in request.POST:
                this_object.pk = None
            this_object.save()
        elif 'delete_strategy' in request.POST:
            this_object = Strategy.objects.get(id=int(request.POST.get('strategy_id')))
            this_object.delete()
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
        strategies = Strategy.objects.filter(subject_id=subject_id)
    strategies = strategies.order_by('index')
    strategy_list = []
    for st in strategies:
        strategy_list.append((st.id, str(st)))
    return JsonResponse({'strategies': strategy_list})


def get_strategy(request, strategy_id):
    this_object = Strategy.objects.get(id=strategy_id)
    this_parent = this_object.subject
    this_grandparent = this_object.subject.category
    plan = []
    plan_matrix = this_object.plan
    if plan_matrix is not None:
        for plan_list in plan_matrix:
            plan.append({
                'plan_list': plan_list,
                'chapter_name': str(Chapter.objects.get(id=plan_list[0])),
                'list_total_points': calculate_total_points(plan_list),
            })
    res = {
        'category': this_grandparent.id,
        'subject': this_parent.id,
        'strategy': this_object.id,
        'name': this_object.name,
        'index': this_object.index,
        'full_path': '/'.join((this_grandparent.name, this_parent.name, this_object.name)),
        'full_index': '/'.join((this_grandparent.index, this_parent.index, this_object.index)),
        'description': this_object.description,
        'timer': '{}分钟'.format(this_object.timer),
        'timer_num': this_object.timer,
        'plan': plan,
    }
    return JsonResponse(res)


def calculate_total_points(plan_list):
    chapter = Chapter.objects.get(id=plan_list[0])
    return sum([x*y for x,y in zip(plan_list[1:], chapter.points)])


def generate_gxb():
    pass


def generate_list():
    pass


def generate_package():
    pass
