from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.urls import reverse
from django.contrib import auth
from django.core import serializers
from django.contrib.auth.decorators import login_required
from exam.models import CodeCategory
from django.contrib import messages
from exam.models import Grade


# Create your views here.
def index(request):
    context = {'n_bar': 'index'}
    return render(request, 'home/index.html', context)


def login(request):
    if request.user.is_authenticated:
        return redirect('home:dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = auth.authenticate(request, username=username, password=password)
        if (user is not None) and user.is_active:
            auth.login(request, user)
            return redirect('home:dashboard')
        else:
            messages.error(request, '账号密码不匹配！')
            return redirect('home:login')
    context = {'n_bar': 'login'}
    return render(request, 'home/login.html', context)


def about(request):
    context = {'n_bar': 'about'}
    return render(request, 'home/about.html', context)


def assessment(request):
    all_codes = {}
    for code_category in CodeCategory.objects.all().order_by('index'):
        all_codes[str(code_category)
                  ] = code_category.codesubject_set.order_by('code')
    context = {
        'n_bar': 'assessment',
        'codes': all_codes
    }
    return render(request, 'home/assessment.html', context)


def contact(request):
    context = {'n_bar': 'contact'}
    return render(request, 'home/contact.html', context)


def courses(request):
    context = {'n_bar': 'courses'}
    return render(request, 'home/courses.html', context)


def grades(request):
    context = {'n_bar': 'grades'}
    return render(request, 'home/grades.html')


def query_grades(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        id = request.POST.get('id', '').strip()
        queryset = Grade.objects.filter(student_name=name, student_id=id)
        if len(queryset):
            return JsonResponse({
                'student_name': name,
                'student_id': id,
                'grades': serializers.serialize("json", queryset),
                'success': True
            })
    return JsonResponse({'success': False})


@login_required()
def logout(request):
    auth.logout(request)
    return redirect('home:login')


@login_required()
def dashboard(request):
    return render(request, 'home/dashboard.html')
