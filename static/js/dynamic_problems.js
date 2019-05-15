function displayModal(action, type) {
    let translations = {
        'add': '添加',
        'edit': '修改',
        'category': '类别',
        'subject': '科目',
        'chapter': '章节'
    };
    let typeSc = translations[type];
    let actionSc = translations[action];
    let $selection = $('#id_' + type);
    let selectedValue = $selection.val();
    let $submitBtn = $('#btn_' + type);
    let $hiddenId = $('#id_' + type + '_id');
    let $modalTitle = $('#title_' + type);
    $submitBtn.attr('name', action + '_' + type);
    $submitBtn.text('确认' + actionSc);
    $hiddenId.val('');
    $modalTitle.text(actionSc + typeSc);
    $('#delete_' + type).attr('hidden', action === 'add');
    // Selection violation
    if (action === 'edit') {
        if (selectedValue === '0') {
            return alert('请选择一个' + typeSc + '！');
        }
        // Hidden field - object id
        $hiddenId.val(selectedValue);
        if (type === 'category') {
            ajaxChangeForm(
                'get_category', selectedValue,
                ['#id_category_name', '#id_category_index'],
                ['name', 'index']
            );
        } else if (type === 'subject') {
            ajaxChangeForm(
                'get_subject', selectedValue,
                ['#id_subject_category', '#id_subject_name', '#id_subject_index'],
                ['category', 'name', 'index']
            );
        } else if (type === 'chapter') {
            let targets = [
                '#id_chapter_category', '#id_chapter_subject',
                '#id_chapter_name', '#id_chapter_index', '#label_chapter_image'
            ];
            let entries = ['category', 'subject', 'name', 'index', 'image_name'];
            for (let i = 1; i < 8; i++) {
                targets.push('#id_point' + i, '#id_difficulty' + i);
                entries.push('point' + i, 'difficulty' + i);
            }
            ajaxChangeForm('get_chapter', selectedValue, targets, entries);
            ajaxChangeSelection(
                'change_category', $('#id_chapter_category').val(),
                ['#id_chapter_subject'], [false], ['subjects'], true
            );
        }
    }
    $('#' + type + '_modal').modal('show');
}

function ajaxChangeSelection(callerType, code, targets, has0, entries, fixedSelection) {
    /*
    callerType: what user clicked on - the component's model type;
    code: model id - i.e., caller's value;
    targets: a list of components that will be affected;
    has0: list, if true, append option "0 - all", if false append "null - select...", else ignore.
    entries: list, identify the data coming.
    fixedSelection: whether maintain the previous selection
     */
    $.ajax({
        url: ['', 'pool', callerType, code, ''].join('/'),
        success: function (data) {
            for (let i = 0; i < targets.length; i++) {
                let $target = $(targets[i]);
                let currentValue = $target.val();
                $target.empty();
                if (!fixedSelection) {
                    if (has0[i]) $target.append($('<option selected></option>').val(0).html('全部'));
                    else $target.append($('<option selected disabled></option>').val('').html('请选择'));
                } else {
                    if (has0[i]) $target.append($('<option></option>').val(0).html('全部'));
                    else $target.append($('<option disabled></option>').val('').html('请选择'));
                }
                let ajaxDict = data[entries[i]];
                $.each(ajaxDict, function (index, text) {
                    if (fixedSelection && text[0].toString() === currentValue) {
                        $target.append($('<option selected></option>').val(text[0]).html(text[1]));
                    } else {
                        $target.append($('<option></option>').val(text[0]).html(text[1]));
                    }
                });
            }
        }
    });
}

function ajaxChangeForm(callerType, code, targets, entries) {
    $.ajax({
        url: ['', 'pool', callerType, code, ''].join('/'),
        success: function (data) {
            for (let i = 0; i < targets.length; i++) {
                let $target = $(targets[i]);
                if ($target.prop('nodeName') === 'LABEL') {
                    let labelText = data[entries[i]];
                    if (labelText === '' || labelText === null || labelText === undefined) {
                        labelText = '上传图片';
                    }
                    $target.html(labelText);
                } else {
                    $target.val(data[entries[i]]);
                }
            }
        }
    });
}

function ajaxChangeTable(callerType, code, targets, entries, specialTargets, specialEntries, specialAttributes) {
    $.ajax({
        url: ['', 'pool', callerType, code, ''].join('/'),
        success: function (data) {
            for (let i = 0; i < targets.length; i++) {
                let $target = $(targets[i]);
                $target.html(data[entries[i]]);
            }
            for (let j = 0; j < specialTargets.length; j++) {
                let sTarget = $(specialTargets[j]);
                if (specialAttributes[j] === 'value') {
                    sTarget.val(data[specialEntries[j]]);
                    continue;
                }
                sTarget.attr(specialAttributes[j], data[specialEntries[j]]);
            }
        }
    });
}

function ajaxChangeProblemTable(callerType, codes, target) {
    /*
    callerType: what user clicked on - the component's model type;
    codes: model id list - i.e., caller's value;
    targets: a list of components that will be affected;
    entries: list, identify the data coming.
     */
    $.ajax({
        url: ['', 'pool', callerType, ''].join('/') + codes.join('/') + '/',
        success: function (data) {
            let $target = $(target);
            $target.html(''); // Empty table
            let total = data['total'];
            let enTypes = data['type_en_abbr'];
            let scTypes = data['type_sc_abbr'];
            for (let i = 0; i < total; i++) { // Each chapter
                let chapter = data[i];
                let $pathRow = $('<tr class="bg-secondary text-white"></tr>');
                let $pathCell = $('<td colspan="3"></td>').html(chapter['path']);
                $pathRow.append($pathCell);
                $target.append($pathRow);
                let empty = true;
                for (let j = 0; j < enTypes.length; j++) {
                    let translation = scTypes[j];
                    let problemSubset = chapter[enTypes[j]];
                    $.each(problemSubset, function (index, text) {
                        empty = false;
                        let $typeCell = $('<td class="cell-1"></td>').html(translation);
                        let $indexCell = $('<td class="cell-2"></td>').html(index);
                        let $descCell = descriptionLink(text[1], text[0], enTypes[j]);
                        let $row = $('<tr></tr>');
                        $row.append($typeCell, $indexCell, $descCell);
                        $target.append($row);
                    });
                }
                if (empty) {
                    let $emptyCell = $('<td colspan="3"></td>').html('无题目');
                    let $row = $('<tr></tr>');
                    $row.append($emptyCell);
                    $target.append($row);
                }
            }
        }
    });
}

function ajaxChangeProblemPreview(callerType, codes) {
    $.ajax({
        url: ['', 'pool', callerType, ''].join('/') + codes.join('/') + '/',
        success: function (data) {
            // Clear right table
            let $preview = $('#problem_preview');
            $preview.html('');
            formatProblemPreview(data, codes);
            if (data.hasOwnProperty('sub')) {
                for (let i = 0; i < data['sub'].length; i++) {
                    codes = [codes[0], codes[1], i + 1];
                    formatProblemPreview(data['sub'][i], codes);
                }
            }
        }
    });
}

function formatProblemPreview(data, codes) {
    let $preview = $('#problem_preview');
    // All components
    // 0 - Paths
    let $path = null;
    if (data.hasOwnProperty('full_path')) {
        $path = $('<div class="font-weight-bold"></div>').html(data['full_path']);
    }
    let $index = null;
    if (data.hasOwnProperty('full_index')) {
        $index = $('<div class="font-weight-bold"></div>').html(data['full_index']);
    }
    // 1 - Description
    let $desc = $('<div></div>').html(data['desc_lines'].join('<br>'));
    let $image = null, $imageLink = null;
    if (data.hasOwnProperty('image')) {
        $image = $('<img src="" class="img-fluid">');
        $image.attr('src', data['image']);
        $imageLink = $('<a href="" target="_blank">点击查看大图</a>');
        $imageLink.attr('href', data['image']);
    }
    // 2 - Choices and images
    let $choices = [];
    if (data.hasOwnProperty('choice_lines')) {
        for (let cl = 0; cl < data['choice_lines'].length; cl++) {
            let choiceRow = $('<tr></tr>');
            choiceRow.append($('<td></td>').html(data['choice_lines'][cl]));
            $choices.push(choiceRow);
            if (data.hasOwnProperty(String.fromCharCode(cl + 65))) {
                let choiceImage = $('<img src="" class="img-fluid">');
                choiceImage.attr('src', data[String.fromCharCode(cl + 65)]);
                let choiceImageLink = $('<a href="" target="_blank">点击查看大图</a>');
                choiceImageLink.attr('href', data[String.fromCharCode(cl + 65)]);
                let choiceImageTwins = [choiceImage, choiceImageLink];
                for (let crc = 0; crc < 2; crc++) {
                    let rowToPush = $('<tr></tr>');
                    let cellToPush = $('<td></td>');
                    cellToPush.append(choiceImageTwins[crc]);
                    rowToPush.append(cellToPush);
                    $choices.push(rowToPush);
                }

            }
        }
    }
    // 3 - Answer
    let $ans = null;
    if (data.hasOwnProperty('ans_lines')) {
        $ans = $('<div></div>').html(data['ans_lines'].join('<br>'));
    }
    let $answerImage = null, $answerImageLink = null;
    if (data.hasOwnProperty('answer_image')) {
        $answerImage = $('<img src="" class="img-fluid">');
        $answerImage.attr('src', data['answer_image']);
        $answerImageLink = $('<a href="" target="_blank">点击查看大图</a>');
        $answerImageLink.attr('href', data['answer_image']);
    }
    // 4 - Other info
    let $info = [];
    let infoAttributes = ['error', 'percentage', 'student_upload', 'chance', 'need_answer'];
    for (let ii = 0; ii < infoAttributes.length; ii++) {
        if (data.hasOwnProperty(infoAttributes[ii])) {
            let infoRow = $('<tr></tr>');
            let infoRawData = data[infoAttributes[ii]];
            if (infoAttributes[ii] === 'error') {
                infoRow.append($('<td></td>').html('允许误差：' + infoRawData + '%'));
            } else if (infoAttributes[ii] === 'percentage') {
                infoRow.append($('<td></td>').html('分值比重：' + infoRawData + '%'));
            } else if (infoAttributes[ii] === 'student_upload') {
                infoRow.append($('<td></td>').html(infoRawData ? '允许考生上传附件' : '禁止考生上传附件'));
            } else if (infoAttributes[ii] === 'chance') {
                infoRow.append($('<td></td>').html('允许机会：' + infoRawData + '次'));
            } else if (infoAttributes[ii] === 'need_answer' && !infoRawData) {
                infoRow.append($('<td></td>').html('本题不需要文字作答'));
            }
            $info.push(infoRow);
        }
    }
    // 5 - Buttons
    let $btnGroup = $('<div class="btn-group btn-group-sm"></div>');
    let $deleteBtn = $('<button type="button" class="btn btn-outline-danger"></button>').text('删除');
    let $aBtn = $('<button type="button" class="btn btn-outline-primary" disabled></button>').text('无附件');
    let $vBtn = $('<button type="button" class="btn btn-outline-primary" disabled></button>').text('无视频');
    if (data.hasOwnProperty('attachment')) {
        $aBtn.attr('disabled', false);
        $aBtn.text('查看附件');
        $aBtn.click(function () {
            location.href = data['attachment'];
        });
    }
    if (data.hasOwnProperty('video')) {
        $vBtn.attr('disabled', false);
        $vBtn.text('查看视频');
        $vBtn.click(function () {
            $('#video_modal').modal('show');
            $('#problem_video').attr('src', data['video']);
        });
    }
    $deleteBtn.click(function () {
        if (confirm('确认要删除本题？')) {
            location.href = ['', 'pool', 'delete_problem', ''].join('/') + codes.join('/') + '/';
        }
    });
    $btnGroup.append($aBtn, $vBtn, $deleteBtn);
    // Append
    let components = [$path, $index, $desc, $image, $imageLink, $choices, $ans, $answerImage, $answerImageLink, $info];
    if (data['can_manage_problems']) components.push($btnGroup);
    for (let i = 0; i < components.length; i++) {
        if (components[i]) {
            if (components[i] instanceof Array) {
                for (let j = 0; j < components[i].length; j++) {
                    $preview.append(components[i][j]);
                }
            } else {
                let row = $('<tr></tr>');
                let cell = $('<td></td>');
                cell.append(components[i]);
                row.append(cell);
                $preview.append(row);
            }
        }
    }
}

function setChapterInfo(pk) {
    let targets = ['#cell_chapter_name', '#cell_chapter_index'];
    let entries = ['full_path', 'full_index'];
    let specialTargets = [
        '#cell_chapter_image',
        '#id_smart_chapter_id', '#id_smart_chapter',
        '#id_group_d_chapter_id', '#id_group_d_chapter',
        '#id_group_e_chapter_id', '#id_group_e_chapter'
    ];
    let specialEntries = ['image_path', 'chapter', 'full_path', 'chapter', 'full_path', 'chapter', 'full_path'];
    let specialAttributes = ['src', 'value', 'value', 'value', 'value', 'value', 'value'];
    let i = 1;
    for (; i <= 7; i++) {
        targets.push('#cell_chapter_point' + i, '#cell_chapter_difficulty' + i);
        entries.push('point' + i, 'difficulty' + i);
    }
    if (pk === 0) { // reset
        for (i = 0; i < targets.length; i++) {
            let emptyCell = $(targets[i]);
            if (i < 2) emptyCell.text('请先选择一个章节');
            else emptyCell.html('');
        }
        $('#cell_chapter_image').attr('src', '/static/img/no_img.png');
        for (let j = 1; j < specialTargets.length; j++) {
            $(specialTargets[j]).val('');
        }
    } else {
        ajaxChangeTable('get_chapter', pk, targets, entries, specialTargets, specialEntries, specialAttributes);
    }
}

function changeFileInput(target, clear, msg) {
    let $target = $(target);
    if (clear) $target.val('');
    $target.next().text(msg);
}

function descriptionLink(description, pk, problemType) {
    let $fakeLink = $('<span class="fake-link"></span>').text(description);
    let $descCell = $('<td></td>');
    $descCell.append($fakeLink);
    $fakeLink.click(function () {
        ajaxChangeProblemPreview('get_problem', [problemType, pk]);
    });
    return $descCell;
}

$('#add_category').click(function () {
    displayModal('add', 'category');
});

$('#add_subject').click(function () {
    displayModal('add', 'subject');
});

$('#add_chapter').click(function () {
    displayModal('add', 'chapter');
});

$('#edit_category').click(function () {
    displayModal('edit', 'category');
});

$('#edit_subject').click(function () {
    displayModal('edit', 'subject');
});

$('#edit_chapter').click(function () {
    displayModal('edit', 'chapter');
});

$('#id_category').change(function () {
    ajaxChangeSelection(
        'change_category', $(this).val(),
        ['#id_subject', '#id_chapter'], [true, true], ['subjects', 'chapters'], false
    );
    setChapterInfo(0);
});

$('#id_subject').change(function () {
    ajaxChangeSelection(
        'change_subject/' + $('#id_category').val(), $(this).val(),
        ['#id_chapter'], [true], ['chapters'], false
    );
    setChapterInfo(0);
});

$('#id_chapter').change(function () {
    setChapterInfo(parseInt($(this).val()));
});

$('#id_chapter_category').change(function () {
    ajaxChangeSelection(
        'change_category', $(this).val(),
        ['#id_chapter_subject'], [false], ['subjects'], false
    );
});

$('#display_problems').click(function () {
    let codes = [$('#id_category').val(), $('#id_subject').val(), $('#id_chapter').val()];
    let target = '#table_problem_set';
    ajaxChangeProblemTable('get_problem_set', codes, target);
});

$('#smart_add').click(function () {
    if ($('#id_chapter').val() === '0') {
        return alert('请先选择一个章节！');
    }
    $('#smart_add_collapse').collapse('toggle');
});

$('#form_smart_add').submit(function (event) {
    let smartId = $('#id_smart_chapter_id').val();
    if (smartId === '' || smartId === undefined) {
        alert('请选择一个章节！');
        event.preventDefault();
    }
});

$('#btn_smart_cancel').click(function () {
    $('#smart_add_collapse').collapse('hide');
});

$('#btn_reset_chapter_image').click(function () {
    changeFileInput('#id_chapter_image', true, '上传图片');
});

$('#btn_reset_smart_attachments').click(function () {
    changeFileInput('#id_smart_attachments', true, '上传附件（可多选）');
});

$('#btn_reset_smart_videos').click(function () {
    changeFileInput('#id_smart_videos', true, '上传视频（可多选）');
});

$('#btn_reset_smart_images').click(function () {
    changeFileInput('#id_smart_images', true, '上传图片（可多选）');
});

$('#id_chapter_image').change(function () {
    changeFileInput('#id_chapter_image', false, $(this).val());
});

$('#id_smart_attachments').change(function () {
    let files = $(this)[0].files;
    changeFileInput('#id_smart_attachments', false, '已选择' + files.length + '个文件');
});

$('#id_smart_images').change(function () {
    let files = $(this)[0].files;
    changeFileInput('#id_smart_images', false, '已选择' + files.length + '张图片');
});

$('#id_smart_videos').change(function () {
    let files = $(this)[0].files;
    changeFileInput('#id_smart_videos', false, '已选择' + files.length + '个视频');
});

$('#group_edit').click(function () {
    if ($('#id_chapter').val() === '0') {
        return alert('请先选择一个章节！');
    }
    $('#group_edit_modal').modal('show');
});

$('#group_delete').click(function () {
    if ($('#id_chapter').val() === '0') {
        return alert('请先选择一个章节！');
    }
    $('#group_delete_modal').modal('show');
});

$('#id_questions').keyup(function () {
    $('#max_input').text(4000 - $(this).val().length);
});

$('#id_group_e_type').change(function () {
    let qType = parseInt($('#id_group_e_type').val());
    let $noteCP = $('#group_e_cp_note');
    let $error = $('#group_e_error_div');
    let $needAnswer = $('#group_e_need_answer_div');
    $noteCP.attr('hidden', qType !== 7);
    $error.attr('hidden', qType !== 7 && qType !== 5);
    $needAnswer.attr('hidden', qType !== 7 && qType !== 6);
});

$('#video_modal').on('hidden.bs.modal', function () {
    $('#problem_video').attr('src', '');
});