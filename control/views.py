from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.utils.encoding import escape_uri_path
from django.http import HttpResponse, JsonResponse
from wsgiref.util import FileWrapper
from .models import *
from os import listdir, remove
import mimetypes
import re
from pool.models import *
from exam.models import *

# Create your views here.
app_name = "control"


@login_required()
def download(request):
    operator = User.objects.get(username=request.user.username)
    access = operator.profile.access
    if not operator.profile.view_access.get('download'):
        return redirect('home:dashboard')
    all_downloads = {
        '考试端': Download.objects.filter(category='E').order_by('-id'),
        '服务端': Download.objects.filter(category='S').order_by('-id'),
        '阅卷端': Download.objects.filter(category='G').order_by('-id'),
        '其他': Download.objects.filter(category='').order_by('-id'),
    }
    if not access.get('private_download', False):
        all_downloads = {
            '考试端': Download.objects.filter(category='E', file_type='公开').order_by('-id'),
            '服务端': Download.objects.filter(category='S', file_type='公开').order_by('-id'),
            '阅卷端': Download.objects.filter(category='G', file_type='公开').order_by('-id'),
            '其他': Download.objects.filter(category='', file_type='公开').order_by('-id'),
        }
    context = {
        'can_manage_download': access.get('manage_download', False),
        'can_clean_cache': access.get('clean_cache', False),
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


def get_download(request, file_id):
    this_file = Download.objects.get(id=file_id)
    filename_as_list = this_file.file.name.split('.')
    filename_as_list[0] = this_file.name
    filename = '.'.join(filename_as_list)
    file_path = 'media/{}'.format(this_file.file.name)
    response = HttpResponse(FileWrapper(
        open(file_path, 'rb')), content_type=mimetypes.guess_type(file_path))
    response['Content-Disposition'] = "attachment; filename*=utf-8''{}".format(
        escape_uri_path(filename))
    return response


@login_required()
def delete_download(request, file_id):
    this_file = Download.objects.get(id=file_id)
    this_file.delete()
    return redirect('control:download')


@login_required()
def account(request):
    operator = User.objects.get(username=request.user.username)
    access = operator.profile.access
    context = {
        'can_edit_info': access.get('edit_info', False),
        'can_manage_users': access.get('manage_users', False) or operator.is_superuser,
        'is_superuser': operator.is_superuser,
        'tag_readonly': '' if access.get('edit_info', False) else 'readonly',
        'all_users': User.objects.all().order_by('username'),
    }
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
        elif 'btn_info' in request.POST:
            operator.profile.full_name = request.POST.get('full_name')
            operator.profile.area = request.POST.get('area')
            operator.profile.school = request.POST.get('school')
            operator.profile.department = request.POST.get('department')
            operator.profile.save()
        elif 'btn_add_inf' in request.POST:
            user_id = int(request.POST.get('inf_user'))
            username = request.POST.get('inf_username')
            area = request.POST.get('inf_area').strip()
            school = request.POST.get('inf_school').strip()
            department = request.POST.get('inf_department').strip()
            full_name = request.POST.get('inf_full_name').strip()
            # Validate username
            r = re.match('[A-Za-z]+[A-Za-z0-9_]*', username)
            if not r:
                messages.error(request, '用户名只能包括大小写英文字母、数字和下划线！')
                return redirect('control:account')
            password = 'myweixun001'
            success_msg = '操作成功！'
            if user_id == 0:
                if User.objects.filter(username=username).exists():
                    messages.error(request, '此用户名已存在！')
                    return redirect('control:account')
                new_user = User.objects.create_user(
                    username.strip(), None, password)
                new_user.save()
                success_msg = '成功创建用户！用户名：{}，初始密码：{}'.format(
                    username, password)
            else:
                new_user = User.objects.get(id=user_id)
                if User.objects.exclude(id=user_id).filter(username=username).exists():
                    messages.error(request, '此用户名已存在！')
                    return redirect('control:account')
                new_user.username = username
            # Set profile
            new_profile = new_user.profile
            if full_name:
                new_profile.full_name = full_name
            if area:
                new_profile.area = area
            if school:
                new_profile.school = school
            if department:
                new_profile.department = department
            new_profile.access = dict(
                view_pool='cb_view_pool' in request.POST,
                view_catalog='cb_view_catalog' in request.POST,
                manage_catalog='cb_manage_catalog' in request.POST,
                view_problems='cb_view_problems' in request.POST,
                manage_problems='cb_manage_problems' in request.POST,
                group_actions='cb_group_actions' in request.POST,

                view_exam='cb_view_exam' in request.POST,
                manage_strategy='cb_manage_strategy' in request.POST,
                generate_exam='cb_generate_exam' in request.POST,
                download_exam='cb_download_exam' in request.POST,
                manage_exam='cb_manage_exam' in request.POST,

                view_certification='cb_view_certification' in request.POST,
                manage_certification='cb_manage_certification' in request.POST,
                download_certification='cb_download_certification' in request.POST,
                manage_code='cb_manage_code' in request.POST,

                edit_info='cb_edit_info' in request.POST,
                manage_users='cb_manage_users' in request.POST,

                view_download='cb_view_download' in request.POST,
                manage_download='cb_manage_download' in request.POST,
                private_download='cb_private_download' in request.POST,
                clean_cache='cb_clean_cache' in request.POST,
            )
            new_profile.save()
            messages.success(request, success_msg)
        elif 'btn_init_pwd' in request.POST:
            this_user = User.objects.get(id=int(request.POST.get('inf_user')))
            init_pwd = 'myweixun001'
            this_user.set_password(init_pwd)
            this_user.save()
            messages.success(request, '密码已成功初始化为{}'.format(init_pwd))
        elif 'btn_del_user' in request.POST:
            this_user = User.objects.get(id=int(request.POST.get('inf_user')))
            if this_user == operator:
                messages.error(request, '您无法删除自己！如需修改请至后台！')
            else:
                this_user.delete()
                messages.success(request, '删除成功！')
        return redirect('control:account')
    return render(request, 'control/account.html', context)


@login_required()
def clean_cache(request):
    def clean(object_class, attribute_name, folder_name):
        object_files = set(map(lambda x: getattr(
            x, attribute_name).name, object_class.objects.all()))
        folder_files = set(
            map(lambda x: f'{folder_name}/{x}', listdir(f'media/{folder_name}/')))
        caches = folder_files - object_files
        for cache in caches:
            remove(f'media/{cache}')

    clean(Download, 'file', 'download')
    clean(Exam, 'package', 'exam')
    clean(StudentListFile, 'student_list', 'list')
    clean(GovernmentCertification, 'package', 'gov')
    clean(Advertisement, 'image', 'ad')
    clean(Agreement, 'image', 'agreement')
    clean(Chapter, 'image', 'chapter')
    # Problem folder
    # All questions
    all_problem_files = set()
    for q_class in [
        MultipleChoice, MultipleResponse, TrueOrFalse, TextBlank, NumericBlank, Description,
    ]:
        for attr in ('image', 'attachment', 'video', 'answer_image'):
            all_problem_files |= set(
                map(lambda x: getattr(x, attr).name, q_class.objects.all()))
    # Comprehensive
    for attr in ('image', 'attachment', 'video'):
        all_problem_files |= set(map(lambda x: getattr(
            x, attr).name, Comprehensive.objects.all()))
    # Sub questions
    for sub_class in [
        SubMultipleChoice, SubMultipleResponse, SubTrueOrFalse, SubTextBlank, SubNumericBlank, SubDescription,
    ]:
        for attr in ('image', 'video', 'answer_image'):
            all_problem_files |= set(
                map(lambda x: getattr(x, attr).name, sub_class.objects.all()))
    # Choices
    for choice_class in [
        MultipleChoiceImage, MultipleResponseImage, SubMultipleChoiceImage, SubMultipleResponseImage,
    ]:
        all_problem_files |= set(map(lambda x: getattr(
            x, attr).name, choice_class.objects.all()))
    # Clean it
    problem_folder_files = set(
        map(lambda x: f'problem/{x}', listdir(f'media/problem/')))
    problem_caches = problem_folder_files - all_problem_files
    for problem_cache in problem_caches:
        remove(f'media/{problem_cache}')
    return JsonResponse({'success': True})


@login_required()
def get_user(request, user_id):
    target_user = User.objects.get(id=user_id)
    return JsonResponse({
        'username': target_user.username,
        'full_name': target_user.profile.full_name,
        'area': target_user.profile.area,
        'school': target_user.profile.school,
        'department': target_user.profile.department,
        'permission': target_user.profile.access
    })


def iterate_problems(chapter_id):
    chapter = Chapter.objects.get(pk=chapter_id)
    problems = []

    def get_basic_info(p, problem_type, is_sub=False):
        # common problems only
        info = {
            'problem_type': problem_type,
            'description': p.description,
            'extra': {
                'upload': p.student_upload,
                'chance': p.chance,
                'answer': p.answer,
            },
            'files': {
                'image': ('/media/' + str(p.image)) if p.image else '',
                'video': ('/media/' + str(p.video)) if p.video else '',
                'answer_image': ('/media/' + str(p.answer_image)) if p.answer_image else '',
            }
        }
        if problem_type == 'dc':
            info['extra']['optional'] = not p.need_answer
        if problem_type == 'nb':
            info['extra']['error'] = p.error
        if problem_type == 'mc' or problem_type == 'mr':
            info['extra']['choices'] = [
                {'choice': chr(65 + idx), 'content': c} for idx, c in enumerate(p.choices)]
            c_imgs = []
            if not is_sub:
                if problem_type == 'mc':
                    c_imgs = MultipleChoiceImage.objects.filter(problem=p)
                if problem_type == 'mr':
                    c_imgs = MultipleResponseImage.objects.filter(problem=p)
            else:
                if problem_type == 'mc':
                    c_imgs = SubMultipleChoiceImage.objects.filter(problem=p)
                if problem_type == 'mr':
                    c_imgs = SubMultipleResponseImage.objects.filter(problem=p)
            info['files']['choice_images'] = []
            if len(c_imgs):
                info['files']['choice_images'] = [
                    {'choice': x.choice, 'path': '/media/' + str(x.image), } for x in c_imgs]
        if is_sub:
            info['percentage'] = p.percentage
            info['index'] = p.order
        else:
            info['index'] = p.index
            info['files'].update(
                {'attachment': ('/media/' + str(p.attachment))
                 if p.attachment else '', }
            )
        return info

    for p in chapter.multiplechoice_set.all():
        problems.append(get_basic_info(p, 'mc'))
    for p in chapter.multipleresponse_set.all():
        problems.append(get_basic_info(p, 'mr'))
    for p in chapter.trueorfalse_set.all():
        problems.append(get_basic_info(p, 'tf'))
    for p in chapter.textblank_set.all():
        problems.append(get_basic_info(p, 'tb'))
    for p in chapter.numericblank_set.all():
        problems.append(get_basic_info(p, 'nb'))
    for p in chapter.description_set.all():
        problems.append(get_basic_info(p, 'dc'))
    for p in chapter.comprehensive_set.all():
        sub_problems = []
        for sub in p.submultiplechoice_set.all():
            sub_problems.append(get_basic_info(sub, 'mc', True))
        for sub in p.submultipleresponse_set.all():
            sub_problems.append(get_basic_info(sub, 'mr', True))
        for sub in p.subtrueorfalse_set.all():
            sub_problems.append(get_basic_info(sub, 'tf', True))
        for sub in p.subtextblank_set.all():
            sub_problems.append(get_basic_info(sub, 'tb', True))
        for sub in p.subnumericblank_set.all():
            sub_problems.append(get_basic_info(sub, 'nb', True))
        for sub in p.subdescription_set.all():
            sub_problems.append(get_basic_info(sub, 'dc', True))
        problems.append({
            'problem_type': 'cp',
            'index': p.index,
            'description': p.description,
            'files': {
                'image': ('/media/' + str(p.image)) if p.image else '',
                'video': ('/media/' + str(p.video)) if p.video else '',
                'attachment': ('/media/' + str(p.attachment)) if p.attachment else '',
            },
            'subs': sub_problems,
        })
    return problems


def get_cover(chapter_id):
    chapter = Chapter.objects.get(pk=chapter_id)
    return ('/media/' + str(chapter.image)) if chapter.image else ''


def iterate_database(id):
    cat = Category.objects.get(pk=id)
    # init current cat dict
    this_cat = {
        'name': cat.name,
        'index': cat.index,
        'subjects': []
    }
    all_subjects = cat.subject_set.all()
    for subj in all_subjects:
        # init current subj dict
        this_subj = {
            'name': subj.name,
            'index': subj.index,
            'chapters': []
        }
        all_chapters = subj.chapter_set.all()
        for chap in all_chapters:
            # init current chap dict
            this_chap = {
                'name': chap.name,
                'index': chap.index,
                'cover': get_cover(chap.id)
            }
            # points and difficulties
            points = chap.points
            points.insert(5, 1)
            this_chap['points'] = points
            difficulties = chap.difficulties
            difficulties.insert(5, 1)
            this_chap['difficulties'] = difficulties
            # problems
            this_chap['problems'] = iterate_problems(chap.id)
            # append chapter
            this_subj['chapters'].append(this_chap)
        this_cat['subjects'].append(this_subj)
    return this_cat


def remote_backup(request, id):
    try:
        res = iterate_database(id)
        return JsonResponse({'data': res}, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'err': str(e)})


def remote_get_category(request):
    all_categories = Category.objects.all()
    res = [
        {'name': c.name, 'index': c.index, 'id': c.id} for c in all_categories]
    return JsonResponse({'data': res}, json_dumps_params={'ensure_ascii': False})
