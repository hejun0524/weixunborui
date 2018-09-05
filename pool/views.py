from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from .models import *
from django.contrib import messages
import re

# Create your views here.

class_list = (MultipleChoice, MultipleResponse, TrueOrFalse, TextBlank, NumericBlank, Description, Comprehensive)
type_sc_abbr = ('单选', '多选', '判断', '文填', '数填', '陈述', '综合')
type_sc_full = ('单项选择题', '多项选择题', '判断题', '文本填空题', '数字填空题', '陈述题', '综合题')
type_en_abbr = ('mc', 'mr', 'tf', 'tb', 'nb', 'dc', 'cp')


def problems(request):
    if request.method == 'POST':
        if 'btn_smart_add' in request.POST:
            chapter_id = int(request.POST.get('smart_chapter_id'))
            question_type = int(request.POST.get('smart_type'))
            smart_images = request.FILES.getlist('smart_images')
            smart_attachments = request.FILES.getlist('smart_attachments')
            smart_text = request.POST.get('questions')
            smart_videos = request.FILES.getlist('smart_videos')
            return smart_add(request, chapter_id, question_type, smart_text, smart_images, smart_attachments,
                             smart_videos)
        if 'add_category' in request.POST:
            new_object = Category(name=request.POST.get('category_name'), index=request.POST.get('category_index'))
            new_object.save()
        elif 'add_subject' in request.POST:
            new_object = Subject(
                category_id=int(request.POST.get('subject_category')),
                name=request.POST.get('subject_name'), index=request.POST.get('subject_index')
            )
            new_object.save()
        elif 'add_chapter' in request.POST:
            points = []
            difficulties = []
            for i in range(1, 8):
                points.append(request.POST.get('point{}'.format(i)))
                difficulties.append(request.POST.get('difficulty{}'.format(i)))
            new_object = Chapter(
                subject_id=int(request.POST.get('chapter_subject')),
                name=request.POST.get('chapter_name'),
                index=request.POST.get('chapter_index'),
                points=points, difficulties=difficulties,
                image=request.FILES.get('chapter_image')
            )
            new_object.save()
        elif 'edit_category' in request.POST:
            this_object = Category.objects.get(id=int(request.POST.get('category_id')))
            this_object.name = request.POST.get('category_name')
            this_object.index = request.POST.get('category_index')
            this_object.save()
        elif 'edit_subject' in request.POST:
            this_object = Subject.objects.get(id=int(request.POST.get('subject_id')))
            this_object.name = request.POST.get('subject_name')
            this_object.index = request.POST.get('subject_index')
            this_object.save()
        elif 'edit_chapter' in request.POST:
            this_object = Chapter.objects.get(id=int(request.POST.get('chapter_id')))
            points = []
            difficulties = []
            for i in range(1, 8):
                points.append(request.POST.get('point{}'.format(i)))
                difficulties.append(request.POST.get('difficulty{}'.format(i)))
            this_object.name = request.POST.get('chapter_name')
            this_object.index = request.POST.get('chapter_index')
            this_object.points = points
            this_object.difficulties = difficulties
            this_object.image = request.FILES.get('chapter_image')
            this_object.save()
        elif 'delete_category' in request.POST:
            this_object = Category.objects.get(id=int(request.POST.get('category_id')))
            this_object.delete()
        elif 'delete_subject' in request.POST:
            this_object = Subject.objects.get(id=int(request.POST.get('subject_id')))
            this_object.delete()
        elif 'delete_chapter' in request.POST:
            this_object = Chapter.objects.get(id=int(request.POST.get('chapter_id')))
            this_object.delete()
        elif 'btn_group_delete' in request.POST:
            this_object = Chapter.objects.get(pk=int(request.POST.get('group_d_chapter_id')))
            if 'delete_checkboxes' in request.POST:
                for type_index in request.POST.getlist('delete_checkboxes'):
                    clear_set = getattr(this_object, class_list[int(type_index)].__name__.lower() + '_set')
                    for q in clear_set.all():
                        q.delete()
        elif 'btn_group_edit' in request.POST:
            pass
        messages.success(request, '操作成功！')
        return redirect('pool:problems')
    chapter_points = tuple(map(lambda num: 'point{}'.format(num), range(1, 8)))
    chapter_difficulties = tuple(map(lambda num: 'difficulty{}'.format(num), range(1, 8)))
    context = {
        'all_categories': Category.objects.order_by('index'),
        'all_subjects': Subject.objects.order_by('index'),
        'all_chapters': Chapter.objects.order_by('index'),
        'type_sc_abbr': type_sc_abbr,
        'type_sc_full': type_sc_full,
        'types': tuple(zip(type_en_abbr, type_sc_full)),
        'chapter_points': chapter_points,
        'chapter_difficulties': chapter_difficulties,
        'chapter_info': tuple(zip(type_sc_full, chapter_points, chapter_difficulties))
    }
    return render(request, 'pool/problems.html', context)


def smart_add(request, chapter_id, question_type, smart_text, smart_images, smart_attachments, smart_videos):
    validation_result = validate_smart_text(question_type, smart_text)
    if not validation_result[0]:
        messages.error(request, validation_result[1])
        return redirect('pool:problems')
    smart_files = {}
    question_info = {}
    for question_index in validation_result[2]:
        q = class_list[question_type - 1](index=question_index, chapter_id=chapter_id)
        question_content = validation_result[2][question_index]
        for attribute in question_content:
            setattr(q, attribute, question_content[attribute])
        q.save()
        question_info[question_index] = {'id': q.id, 'type': question_type, }
        init_files = {'video': None, 'attachment': None, 'image': None, 'answer_image': None, }
        if question_type == 1 or question_type == 2:
            init_files.update({'choice_images': {}})
        smart_files[question_index] = init_files
    # Images, attachments and videos
    all_files = [(smart_images, 'image'), (smart_attachments, 'attachment'), (smart_videos, 'video')]
    for file_set in all_files:
        for smart_file in file_set[0]:
            fvr = validate_smart_file(smart_files, smart_file, file_set[1])
            if not fvr[0]:  # File validation result
                messages.error(request, fvr[1])
                return redirect('pool:problems')
            if fvr[2] == 'choice_images':
                smart_files[fvr[1]][fvr[2]][fvr[3]] = smart_file
            else:
                smart_files[fvr[1]][fvr[2]] = smart_file
    for question_index in smart_files:
        question_files = smart_files[question_index]
        question_id_type = question_info[question_index]
        q = class_list[question_id_type['type'] - 1].objects.get(pk=question_id_type['id'])
        for attribute in question_files:
            if attribute == 'choice_images':
                for option in question_files[attribute]:
                    if option:
                        replace_or_create(q.__class__.__name__, q.id, option, question_files[attribute][option])
            if question_files[attribute]:
                setattr(q, attribute, question_files[attribute])
                q.save()
    messages.success(request, validation_result[1])
    return redirect('pool:problems')


def validate_smart_text(question_type, smart_text):
    def wrong_message(warning):
        return False, warning, {}

    result = {}
    if not 1 <= question_type <= 7:  # Wrong type (impossible to happen though)
        return wrong_message('题型错误！')
    lines = smart_text.strip().split('\r\n')
    current_code = 1
    index = None
    for line in lines:
        line = line.strip()
        if not line:  # Empty line
            continue
        identifier = smart_identifier(line, current_code)  # Identify the line
        current_code = identifier[0]  # Update current code
        if current_code == 1:
            index = identifier[1]
            if index in result:
                return wrong_message('您有重复的题目索引号！位置：' + line)
            result[index] = {}
            result[index]['description'] = identifier[2]
        elif index is None:
            return wrong_message('您尚未指定索引号！位置：' + line)
        elif current_code == 10:
            result[index]['description'] += '\r\n' + identifier[1]
        elif current_code == 6:
            result[index].update({'answer': identifier[1], })
        elif current_code == 60:
            result[index]['answer'] += '\r\n' + identifier[1]
        elif current_code == 7:
            result[index]['student_upload'] = identifier[1]
        elif current_code == 5:
            result[index]['chance'] = identifier[1]
        elif current_code == 4:
            if question_type != 5:
                return wrong_message('此题应归类为数字填空！位置：' + line)
            result[index]['error'] = identifier[1]
        elif current_code == 8:
            if question_type > 2:
                return wrong_message('此题应归类为选择题！位置：' + line)
            if 'choices' in result[index]:
                result[index]['choices'].append((identifier[1], identifier[2]))
            else:
                result[index]['choices'] = [(identifier[1], identifier[2]), ]

    valid = True
    required_fields = ['description', 'answer', ]
    if question_type == 1 or question_type == 2:
        required_fields.append('choices')
    message = '已成功添加题目，请选择章节并点击显示题目进行查看！'
    # Check required fields and validate answers
    for question_index in result:
        question_content = result[question_index]
        print(question_content, required_fields)
        for field in required_fields:
            if field not in question_content:
                return wrong_message('您的题目缺失必要信息！题目号：' + question_index)
            if field == 'answer':  # Check answer format
                current_answer = question_content[field]
                if question_type == 5:
                    try:
                        result[question_index][field] = float(current_answer)
                    except ValueError:
                        return wrong_message('数字填空答案必须为数字！题目号：' + question_index)
                if question_type <= 2:
                    separated_choices = list(zip(*result[question_index]['choices']))
                    result[question_index]['choices'] = separated_choices[1]
                    if question_type == 2:
                        result[question_index][field] = list(current_answer)
                    for correct_choice in current_answer:
                        if question_type == 1 and len(current_answer) != 1:
                            return wrong_message('单选题答案只能为一个选项！题目号：' + question_index)
                        if correct_choice not in separated_choices[0]:
                            return wrong_message('答案和选项不符！题目号：' + question_index)
    return valid, message, result


def smart_identifier(line, current_code):
    r = re.match('([A-Za-z0-9]*)[\t\s](.*)', line)
    if r:  # Code 1: Start of the description with index
        return 1, r.group(1).strip(), r.group(2).strip()
    r = re.match('[(（](\d+)[）)](.*)', line)
    if r:  # Code 2: Sub questions
        return 2, int(r.group(1).strip()), r.group(2).strip()
    r = re.match('分值比重：[\t\s]*(\d*\.?\d*)%', line)
    if r:  # Code 3: Percentage
        return 3, float(r.group(1).strip())
    r = re.match('允许误差：[\t\s]*(\d*\.?\d*)%', line)
    if r:  # Code 4: Error
        return 4, float(r.group(1).strip())
    r = re.match('允许机会：[\t\s]*(\d*)次', line)
    if r:  # Code 5: Chance
        return 5, int(r.group(1).strip())
    r = re.match('答案：(.*)', line)
    if r:  # Code 6: Answer
        return 6, r.group(1).strip()
    r = re.match('允许考生上传附件', line)
    if r:  # Code 7: Upload
        return 7, True
    r = re.match('[(（]([A-Z])[）)](.*)', line)
    if r:  # Code 8: Choices
        return 8, r.group(1).strip(), r.group(2).strip()
    r = re.match('题型：(.*)', line)
    if r:  # Code 9: Type of questions - for secondary parts
        return 9, r.group(1).strip()
    if current_code % 10 == 0:  # Code line breaks
        return current_code, line.strip()
    return current_code * 10, line.strip()  # Code line breaks


def validate_smart_file(smart_files, smart_file, file_type):
    corresponding_index = smart_file.name.split('.')[0].strip()
    file_type_translation = {'image': '图片', 'attachment': '附件', 'video': '视频'}
    file_type_sc = file_type_translation[file_type]
    choice_index = ''
    if file_type == 'image':
        r = re.match('(.*)-ans', corresponding_index)
        if r:  # Answer image
            corresponding_index = r.group(1).strip()
            file_type = 'answer_image'
        r = re.match('(.*)-([A-Z])', corresponding_index)
        if r:  # Choice image
            corresponding_index = r.group(1).strip()
            file_type = 'choice_images'
            choice_index = r.group(2).strip()
    # Validate index
    if corresponding_index not in smart_files:
        return False, '您有多余的{}，文件名为{}'.format(file_type_sc, smart_file.name)
    if smart_files[corresponding_index][file_type]:
        if file_type == 'choice_images':
            if choice_index in smart_files[corresponding_index][file_type]:
                return False, '您有多余的{}，文件名{}'.format(file_type_sc, smart_file.name)
        else:
            return False, '您有重复的{}，文件名{}'.format(file_type_sc, smart_file.name)
    return True, corresponding_index, file_type, choice_index


def replace_or_create(question_type, question_id, option, choice_image):
    ci_class_dict = {
        'MultipleChoice': MultipleChoiceImage,
        'MultipleResponse': MultipleResponseImage,
        'SubMultipleChoice': SubMultipleChoiceImage,
        'SubMultipleResponse': SubMultipleResponseImage,
    }
    object_class = ci_class_dict[question_type]
    ci_object, created = object_class.objects.get_or_create(problem_id=question_id, choice=option)
    if created:
        ci_object.image = choice_image
        ci_object.save()
    else:
        ci_object.delete()
        replace_or_create(question_type, question_id, option, choice_image)


# AJAX functions
def change_category(request, category_id):
    if category_id == 0:
        subjects = Subject.objects.all()
    else:
        selected_category = Category.objects.get(pk=category_id)
        subjects = Subject.objects.filter(category=selected_category)
    subjects = subjects.order_by('index')
    subject_list = []
    chapter_list = []
    for sub in subjects:
        subject_list.append((sub.id, str(sub)))
        chapters = Chapter.objects.filter(subject=sub).order_by('index')
        for chap in chapters:
            chapter_list.append((chap.id, str(chap)))
    return JsonResponse({'subjects': subject_list, 'chapters': chapter_list})


def change_subject(request, category_id, subject_id):
    if subject_id == 0:
        return change_category(request, category_id)
    else:
        selected_subject = Subject.objects.get(pk=subject_id)
        chapters = Chapter.objects.filter(subject=selected_subject)
    chapters = chapters.order_by('index')
    chapter_list = []
    for chap in chapters:
        chapter_list.append((chap.id, str(chap)))
    return JsonResponse({'chapters': chapter_list})


def get_category(request, category_id):
    this_object = Category.objects.get(id=category_id)
    return JsonResponse({
        'name': this_object.name,
        'index': this_object.index
    })


def get_subject(request, subject_id):
    this_object = Subject.objects.get(id=subject_id)
    return JsonResponse({
        'category': this_object.category_id,
        'name': this_object.name,
        'index': this_object.index
    })


def get_chapter(request, chapter_id):
    this_object = Chapter.objects.get(id=chapter_id)
    this_parent = this_object.subject
    this_grandparent = this_object.subject.category
    res = {
        'category': this_grandparent.id,
        'subject': this_parent.id,
        'chapter': this_object.id,
        'name': this_object.name,
        'index': this_object.index,
        'full_path': '/'.join((this_grandparent.name, this_parent.name, this_object.name)),
        'full_index': '/'.join((this_grandparent.index, this_parent.index, this_object.index)),
        'image_name': str(this_object.image).split('/')[-1],
        'image_path': '/media/' + str(this_object.image) if this_object.image else '/static/img/dummy.png',
    }
    for i in range(1, 8):
        res['point{}'.format(i)] = this_object.points[i - 1]
        res['difficulty{}'.format(i)] = this_object.difficulties[i - 1]
    return JsonResponse(res)


def get_problem_set(request, category_id, subject_id, chapter_id):
    def get_dict(chap):
        res = dict()
        set_dict = {
            'mc': chap.multiplechoice_set.all().order_by('index'),
            'mr': chap.multipleresponse_set.all().order_by('index'),
            'tf': chap.trueorfalse_set.all().order_by('index'),
            'tb': chap.textblank_set.all().order_by('index'),
            'nb': chap.numericblank_set.all().order_by('index'),
            'dc': chap.description_set.all().order_by('index'),
            'cp': chap.comprehensive_set.all().order_by('index'),
        }
        res['path'] = chap.subject.category.name + '/' + chap.subject.name + '/' + chap.name
        for abbr in set_dict:
            res[abbr] = dict()
            for x in set_dict[abbr]:
                res[abbr][x.index] = (x.id, x.description)
        return res

    result = dict()
    chapter_list = []
    if chapter_id > 0:  # Get one specific chapter's all problems
        this_chapter = Chapter.objects.get(id=chapter_id)
        chapter_list.append(this_chapter)
    elif subject_id > 0:  # Get one specific subject's all problems
        this_subject = Subject.objects.get(id=subject_id)
        for ch in this_subject.chapter_set.all().order_by('index'):
            chapter_list.append(ch)
    elif category_id > 0:  # Get one specific category's all problems
        this_category = Category.objects.get(id=category_id)
        for s in this_category.subject_set.all().order_by('index'):
            for ch in s.chapter_set.all().order_by('index'):
                chapter_list.append(ch)
    else:  # Get all
        for c in Category.objects.all().order_by('index'):
            for s in c.subject_set.all().order_by('index'):
                for ch in s.chapter_set.all().order_by('index'):
                    chapter_list.append(ch)
    for i in range(len(chapter_list)):
        result[i] = get_dict(chapter_list[i])
    result.update({
        'type_sc_abbr': type_sc_abbr,
        'type_en_abbr': type_en_abbr,
        'total': len(chapter_list)
    })
    return JsonResponse(result)


def get_problem(request, problem_type, problem_id):
    if problem_type not in type_en_abbr:
        messages.error(request, '无法处理该请求！')
        return redirect('pool:problems')
    type_index = type_en_abbr.index(problem_type)
    this_problem = class_list[type_index].objects.get(pk=problem_id)
    this_chapter = this_problem.chapter
    this_subject = this_chapter.subject
    this_category = this_subject.category
    # Get content
    ans_lines = '答案：{}'.format(this_problem.answer).split('\r\n')
    if type(this_problem.answer) == list:
        ans_lines = '答案：{}'.format(''.join(this_problem.answer)).split('\r\n')
    result = {
        'type_sc': type_sc_full[type_index],
        'category': this_category.id,
        'subject': this_subject.id,
        'chapter': this_chapter.id,
        'full_index': '/'.join((this_category.index, this_subject.index, this_chapter.index, this_problem.index)),
        'full_path': '/'.join((this_category.name, this_subject.name, this_chapter.name, type_sc_full[type_index])),
        'desc_lines': str(this_problem).split('\r\n'),
        'ans_lines': ans_lines,
    }
    if problem_type == 'mc' or problem_type == 'mr':
        choice_lines = []
        for i in range(len(this_problem.choices)):
            choice = this_problem.choices[i]
            choice_lines.append('(' + chr(65 + i) + ')' + choice)
        result['choice_lines'] = choice_lines
    # Get media set
    media_set = {}
    media_set_names = ('image', 'attachment', 'video', 'answer_image')
    for media in media_set_names:
        if hasattr(this_problem, media):
            if getattr(this_problem, media):
                media_set[media] = '/media/{}'.format(str(getattr(this_problem, media)))
    image_set = this_problem.__class__.__name__.lower() + 'image_set'
    if hasattr(this_problem, image_set):
        for choice_image in getattr(this_problem, image_set).all():
            media_set[choice_image.choice] = '/media/{}'.format(str(choice_image.image))
    result.update(media_set)
    return JsonResponse(result)


def delete_problem(request, problem_type, problem_id):
    if problem_type not in type_en_abbr:
        messages.error(request, '无法处理该请求！')
        return redirect('pool:problems')
    type_index = type_en_abbr.index(problem_type)
    this_problem = class_list[type_index].objects.get(pk=problem_id)
    this_problem.delete()
    messages.success(request, '成功删除本题！')
    return redirect('pool:problems')
