from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.core.files.base import ContentFile
from django.utils.encoding import escape_uri_path
from wsgiref.util import FileWrapper
from pool.models import Category, Subject, Chapter
from .models import *
from PIL import Image
from zipfile import ZipFile
from io import BytesIO
import json
import re
import uuid
import xlwt

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
        'all_ads': Advertisement.objects.all(),
        'all_agreements': Agreement.objects.all(),
        'all_exams': Exam.objects.all().order_by('-created'),
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
        elif 'add_student_list' in request.POST:
            pass
        elif 'add_exam' in request.POST:
            new_object = Exam(
                title=request.POST.get('exam_title'),
                location=request.POST.get('exam_location'),
                section=request.POST.get('exam_section')
            )
        elif 'btn_add_ad' in request.POST:
            new_object = Advertisement(name=request.POST.get('ad_name'), image=request.FILES.get('ad_image'))
            if request.POST.get('ad_description'):
                new_object.description = request.POST.get('ad_description')
            new_object.save()
        elif 'btn_add_agreement' in request.POST:
            new_object = Agreement(name=request.POST.get('agreement_name'), image=request.FILES.get('agreement_image'))
            if request.POST.get('agreement_description'):
                new_object.description = request.POST.get('agreement_description')
            new_object.save()
        messages.success(request, '操作成功！')
        return redirect('exam:exams')
    return render(request, 'exam/exams.html', context)


def certification(request):
    url_name = 'exam:certification'
    context = {
        'all_certifications': GovernmentCertification.objects.all().order_by('-created'),
        'all_exams': Exam.objects.all(),
        'all_student_lists': StudentList.objects.all(),
        'all_code_categories': CodeCategory.objects.all().order_by('index'),
        'all_strategies': Strategy.objects.all().order_by('index'),
        'all_code_subjects': CodeSubject.objects.all().order_by('code'),
    }
    if request.method == 'POST':
        if 'btn_certification' in request.POST:
            new_object = GovernmentCertification(
                name=request.POST.get('certification_name'),
                project=request.POST.get('certification_project'),
                verified=request.POST.get('certification_verified'),
                school=request.POST.get('certification_school')
            )
            new_object_subject = request.POST.get('certification_subject')
            if new_object_subject is None:
                new_object_subject = ''
            new_object.subject = new_object_subject
            # Parse students
            students = request.POST.get('students').split('\r\n')
            student_json = {}
            student_photos_dict = {}
            for student in students:
                student = student.strip()
                if student:
                    r = re.match('(.*)-(.*)-(.*)', student)
                    if r:
                        this_exam_id = r.group(1).strip()
                        this_student_name = r.group(2).strip()
                        this_student_id = r.group(3).strip()
                        if this_exam_id in student_json:
                            return wrong_message(request, '您有重复的考试号！考试号：{}'.format(this_exam_id), url_name)
                        student_json[this_exam_id] = (this_student_name, this_student_id,)
                        student_photos_dict['{}{}'.format(this_exam_id, this_student_name)] = None
                    else:
                        return wrong_message(request, '学生列表输入格式有误！位置：{}'.format(student), url_name)
            student_photos = request.FILES.getlist('certification_photos')
            # Validate photos first
            for photo in student_photos:
                photo_name = photo.name.strip()
                r = re.match('(.*)\.(.*)', photo_name)
                if r:
                    id_name = r.group(1).strip()
                    if id_name not in student_photos_dict:
                        return wrong_message(request, '您有多余的学生照片，文件名为{}'.format(photo_name), url_name)
                    if student_photos_dict[id_name] is not None:
                        return wrong_message(request, '您有重复学生照片，文件名为{}'.format(photo_name), url_name)
                    student_photos_dict[id_name] = photo
                else:
                    messages.error(request, '无法识别的文件，文件名为{}'.format(photo_name))
                    return redirect('exam:certification')
            # Prepare the big zip
            buffer_zf = BytesIO()
            zf = ZipFile(buffer_zf, 'w')
            for id_name in student_photos_dict:
                photo = student_photos_dict[id_name]
                if photo:
                    buffer_photo = BytesIO()
                    try:
                        pil_image = Image.open(photo)
                        pil_image = pil_image.convert('RGB')
                        pil_image.save(buffer_photo, format='JPEG')
                        zf.writestr('{}.jpg'.format(id_name), buffer_photo.getvalue())
                    finally:
                        buffer_photo.close()
            zf.writestr('{}.xls'.format(new_object.name if new_object.name else '未命名表单'), generate_excel({
                'student_json': student_json,
                'name': new_object.name,
                'project': new_object.project,
                'verified': new_object.verified,
                'school': new_object.school,
                'subject': new_object.subject,
            }))
            zf.close()
            new_object.student_list = student_json
            new_object.package.save('{}.zip'.format(uuid.uuid4().hex), ContentFile(buffer_zf.getvalue()))
        elif 'btn_add_code' in request.POST:
            code_category_id = int(request.POST.get('code_category'))
            new_object = CodeSubject(
                name=request.POST.get('code_name'),
                code=request.POST.get('code_code')
            )
            if code_category_id == 0:
                new_code_category = CodeCategory(
                    name=request.POST.get('new_code_category'),
                    index=request.POST.get('new_code_category_index')
                )
                new_code_category.save()
                new_object.category = new_code_category
            else:
                new_object.category_id = code_category_id
            if request.POST.get('code_price'):
                new_object.price = float(request.POST.get('code_price'))
            if request.POST.get('code_description'):
                new_object.description = request.POST.get('code_description')
            new_object.save()
        messages.success(request, '操作成功！')
        return redirect('exam:certification')
    return render(request, 'exam/certification.html', context)


def get_certification(request, certification_id):
    this_file = GovernmentCertification.objects.get(id=certification_id)
    file_path = 'media/{}'.format(this_file.package.name)
    file_name = this_file.name if this_file.name else '未命名认证包'
    response = HttpResponse(FileWrapper(open(file_path, 'rb')), content_type='application/zip')
    response['Content-Disposition'] = "attachment; filename*=utf-8''{}.zip".format(escape_uri_path(file_name))
    return response


def delete_certification(request, certification_id):
    this_object = GovernmentCertification.objects.get(pk=certification_id)
    this_object.delete()
    return redirect('exam:certification')


def wrong_message(request, msg, redirect_to):
    messages.error(request, msg)
    return redirect(redirect_to)


def generate_excel(form_data, is_sign=False):
    buffer_excel = BytesIO()
    student_json = form_data['student_json']
    wb = xlwt.Workbook(encoding='utf-8')
    ws = wb.add_sheet('考生名单')
    row_num = 0
    font_style = xlwt.XFStyle()
    # First the header
    headers = [
        '序号', '姓名', '考试项目', '课程/级别', '通过方式',
        '证书编号', '身份证号', '成绩', '考试时间', '学校',
    ]
    if is_sign:
        headers = ['考试编号', '考生姓名', '证件号', '签名']
    for col_num in range(len(headers)):
        ws.write(row_num, col_num, headers[col_num], font_style)
        ws.col(col_num).width = 256 * 20
    # Now comes the info
    for exam_id in student_json:
        student_name, student_id = list(student_json[exam_id])
        subject = form_data['subject']
        r = re.match('(.*)-(.*)', subject)
        if r:
            subject = r.group(2).strip()
        student_info = [
            exam_id, student_name, form_data['project'], subject, form_data['verified'],
            '', student_id, '', '', form_data['school'],
        ]
        row_num += 1
        for col_num in range(len(student_info)):
            ws.write(row_num, col_num, student_info[col_num], font_style)
    wb.save(buffer_excel)
    buffer_value = buffer_excel.getvalue()
    buffer_excel.close()
    return buffer_value


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
    return sum([x * y for x, y in zip(plan_list[1:], chapter.points)])


def get_picture(request, picture_type, picture_id):
    aa_dict = {
        'ad': ('/static/img/ad_sc.jpg', Advertisement, ),
        'agreement': ('/static/img/agreement_sc.png', Agreement, ),
    }
    if picture_id == 0:
        return JsonResponse({'image_path': aa_dict[picture_type][0]})
    this_object = aa_dict[picture_type][1].objects.get(id=picture_id)
    return JsonResponse({'image_path': '/media/' + str(this_object.image)})

