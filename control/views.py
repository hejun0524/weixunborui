from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.utils.encoding import escape_uri_path
from django.http import HttpResponse
from wsgiref.util import FileWrapper
from .models import *
import mimetypes
import datetime
import re
from dateutil import relativedelta

# Create your views here.
app_name = "control"
roles = ['超级用户', '系统管理员', '校园管理员', '题库编辑', '教师', '学生']
roles = list(zip(list(range(len(roles))), roles))


@login_required()
def download(request):
    all_downloads = {
        '考试端': Download.objects.filter(category='E').order_by('-id'),
        '服务端': Download.objects.filter(category='S').order_by('-id'),
        '阅卷端': Download.objects.filter(category='G').order_by('-id'),
        '其他': Download.objects.filter(category='').order_by('-id'),
    }
    context = {
        'all_downloads': all_downloads,
    }
    if request.method == 'POST':
        name = request.POST.get('name')
        version = request.POST.get('version')
        description = request.POST.get('description')
        update_log_text = request.POST.get('update_log')
        file = request.FILES['file']
        file_type = request.POST.get('file_type')
        file_category = request.POST.get('file_category')
        file_category = '' if file_category == 'O' else file_category
        new_download = Download(
            name=name,
            version=version,
            description=description,
            update_log=update_log_text,
            file=file,
            file_type=file_type,
            category=file_category
        )
        new_download.save()
        return redirect('control:download')
    return render(request, 'control/download.html', context)


@login_required()
def get_download(request, file_id):
    this_file = Download.objects.get(id=file_id)
    filename_as_list = this_file.file.name.split('.')
    filename_as_list[0] = this_file.name
    filename = '.'.join(filename_as_list)
    file_path = 'media/{}'.format(this_file.file.name)
    response = HttpResponse(FileWrapper(open(file_path, 'rb')), content_type=mimetypes.guess_type(file_path))
    response['Content-Disposition'] = "attachment; filename*=utf-8''{}".format(escape_uri_path(filename))
    return response


@login_required()
def delete_download(request, file_id):
    this_file = Download.objects.get(id=file_id)
    this_file.delete()
    return redirect('control:download')


@login_required()
def account(request):
    operator = User.objects.get(username=request.user.username)
    operator_level = operator.profile.level
    if operator_level == len(roles) - 1:
        return redirect('home:dashboard')  # Get rid of it
    if request.method == 'POST':
        if 'btn_password' in request.POST:
            # Verify old password
            old_pwd = request.POST.get('old_password')
            new_pwd = request.POST.get('new_password')
            if operator.check_password(old_pwd):
                operator.set_password(new_pwd)
                operator.save()
                update_session_auth_hash(request, operator)
                messages.success(request, '更改成功！')
            else:
                messages.error(request, '您的旧密码输入有误！')
        return redirect('control:account')
    return render(request, 'control/account.html')


@login_required()
def inferior(request):
    operator = User.objects.get(username=request.user.username)
    operator_level = operator.profile.level
    if operator_level == len(roles) - 1:
        return redirect('home:dashboard')  # Get rid of it
    context = {
        'all_graders': Grader.objects.all().order_by('username'),
        'all_users': User.objects.all().order_by('username'),
        'roles': roles[operator_level + 1:],
    }
    if request.method == 'POST':
        if 'btn_add_inf' in request.POST:
            username = request.POST.get('inf_username')
            r = re.match('[A-Za-z]+[A-Za-z0-9_]*', username)
            if not r:
                messages.error(request, '用户名只能包括大小写英文字母、数字和下划线！')
                return redirect('control:inferior')
            # this is a non-ascii character. Do something.
            password = 'myweixun001'
            level = request.POST.get('inf_role')
            area = request.POST.get('inf_area').strip()
            school = request.POST.get('inf_school').strip()
            department = request.POST.get('inf_department').strip()
            full_name = request.POST.get('inf_full_name').strip()
            if User.objects.filter(username=username).exists():
                messages.error(request, '此用户名已存在！')
                return redirect('control:inferior')
            new_user = User.objects.create_user(username.strip(), None, password)
            new_user.save()
            new_profile = new_user.profile
            new_profile.level = int(level)
            new_profile.full_name = full_name
            if area:
                new_profile.area = area
            if school:
                new_profile.school = school
            if department:
                new_profile.department = department
            new_profile.save()
            messages.success(request, '成功创建用户！用户名：{}，初始密码：{}'.format(username, password))
        elif 'btn_add_grader' in request.POST:
            if request.method == 'POST':
                username = request.POST.get('grader_username')
                user_profile = Profile.objects.get(user__username=username)
                plan = int(request.POST.get('grader_plan'))
                today = datetime.date.today()
                extension_length = relativedelta.relativedelta(months=+plan)
                if Grader.objects.filter(username=user_profile).exists():
                    this_grader = Grader.objects.get(username=user_profile)
                    this_grader.plan = plan
                    start_date = today if this_grader.date_expire < today else this_grader.date_expire
                    this_grader.date_expire = start_date + extension_length
                    this_grader.save()
                else:
                    this_grader = Grader(username=user_profile, plan=plan, date_expire=today + extension_length)
                    this_grader.save()
        return redirect('control:inferior')
    return render(request, 'control/inferior.html', context)