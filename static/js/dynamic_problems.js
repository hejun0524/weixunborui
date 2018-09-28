function displayModal(action, type) {
    var translations = {
        'add': '添加',
        'edit': '修改',
        'category': '类别',
        'subject': '科目',
        'chapter': '章节'
    };
    var typeSc = translations[type];
    var actionSc = translations[action];
    var $selection = $('#id_' + type);
    var selectedValue = $selection.val();
    var $submitBtn = $('#btn_' + type);
    var $hiddenId = $('#id_' + type + '_id');
    var $modalTitle = $('#title_' + type);
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
            var targets = [
                '#id_chapter_category', '#id_chapter_subject',
                '#id_chapter_name', '#id_chapter_index', '#label_chapter_image'
            ];
            var entries = ['category', 'subject', 'name', 'index', 'image_name'];
            for (var i = 1; i < 8; i++) {
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
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                var currentValue = $target.val();
                $target.empty();
                if (!fixedSelection) {
                    if (has0[i]) $target.append($('<option selected></option>').val(0).html('全部'));
                    else $target.append($('<option selected disabled></option>').val('').html('请选择'));
                } else {
                    if (has0[i]) $target.append($('<option></option>').val(0).html('全部'));
                    else $target.append($('<option disabled></option>').val('').html('请选择'));
                }
                var ajaxDict = data[entries[i]];
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
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                if ($target.prop('nodeName') === 'LABEL') {
                    var labelText = data[entries[i]];
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
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                $target.html(data[entries[i]]);
            }
            for (var j = 0; j < specialTargets.length; j++) {
                var sTarget = $(specialTargets[j]);
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
            var $target = $(target);
            $target.html(''); // Empty table
            var total = data['total'];
            var enTypes = data['type_en_abbr'];
            var scTypes = data['type_sc_abbr'];
            for (var i = 0; i < total; i++) { // Each chapter
                var chapter = data[i];
                var $pathRow = $('<tr class="bg-secondary text-white"></tr>');
                var $pathCell = $('<td colspan="3"></td>').html(chapter['path']);
                $pathRow.append($pathCell);
                $target.append($pathRow);
                var empty = true;
                for (var j = 0; j < enTypes.length; j++) {
                    var translation = scTypes[j];
                    var problemSubset = chapter[enTypes[j]];
                    $.each(problemSubset, function (index, text) {
                        empty = false;
                        var $typeCell = $('<td class="cell-1"></td>').html(translation);
                        var $indexCell = $('<td class="cell-2"></td>').html(index);
                        var $descCell = descriptionLink(text[1], text[0], enTypes[j]);
                        var $row = $('<tr></tr>');
                        $row.append($typeCell, $indexCell, $descCell);
                        $target.append($row);
                    });
                }
                if (empty) {
                    var $emptyCell = $('<td colspan="3"></td>').html('无题目');
                    var $row = $('<tr></tr>');
                    $row.append($emptyCell);
                    $target.append($row);
                }
            }
        }
    });
}

function ajaxChangeProblemPreview(callerType, codes, $caller) {
    $.ajax({
        url: ['', 'pool', callerType, ''].join('/') + codes.join('/') + '/',
        success: function (data) {
            // Clear right table
            var $preview = $('#problem_preview');
            $preview.html('');
            formatProblemPreview(data);
            if (data.hasOwnProperty('sub')){
                for (var i = 0; i < data['sub'].length; i++){
                    formatProblemPreview(data['sub'][i]);
                }
            }
        }
    });
}

function formatProblemPreview(data){
    var $preview = $('#problem_preview');
    // All components
    // 0 - Paths
    var $path = null;
    if (data.hasOwnProperty('full_path')){
        $path = $('<div class="font-weight-bold"></div>').html(data['full_path']);
    }
    var $index = null;
    if (data.hasOwnProperty('full_index')){
        $index = $('<div class="font-weight-bold"></div>').html(data['full_index']);
    }
    // 1 - Description
    var $desc = $('<div></div>').html(data['desc_lines'].join('<br>'));
    var $image = null;
    if (data.hasOwnProperty('image')) {
        $image = $('<img src="" class="img-fluid">');
        $image.attr('src', data['image']);
    }
    // 2 - Choices and images
    var $choices = [];
    if (data.hasOwnProperty('choice_lines')) {
        for (var cl = 0; cl < data['choice_lines'].length; cl++){
            var choiceRow = $('<tr></tr>');
            choiceRow.append($('<td></td>').html(data['choice_lines'][cl]));
            $choices.push(choiceRow);
            if(data.hasOwnProperty(String.fromCharCode(cl + 65))){
                var imageRow = $('<tr></tr>');
                var imageCell = $('<td></td>');
                var choiceImage = $('<img src="" class="img-fluid">');
                choiceImage.attr('src', data[String.fromCharCode(cl + 65)]);
                imageCell.append(choiceImage);
                imageRow.append(imageCell);
                $choices.push(imageRow);
            }
        }
    }
    // 3 - Answer
    var $ans = null;
    if (data.hasOwnProperty('ans_lines')) {
        $ans = $('<div></div>').html(data['ans_lines'].join('<br>'));
    }
    var $answerImage = null;
    if (data.hasOwnProperty('answer_image')) {
        $answerImage = $('<img src="" class="img-fluid">');
        $answerImage.attr('src', data['answer_image']);
    }
    // 4 - Other info
    var $info = [];
    var infoAttributes = ['error', 'percentage', 'student_upload', 'chance', 'need_answer'];
    for (var ii = 0; ii < infoAttributes.length; ii++){
        if (data.hasOwnProperty(infoAttributes[ii])){
            var infoRow = $('<tr></tr>');
            var infoRawData = data[infoAttributes[ii]];
            if (infoAttributes[ii] === 'error'){
                infoRow.append($('<td></td>').html('允许误差：' + infoRawData + '%'));
            } else if (infoAttributes[ii] === 'percentage') {
                infoRow.append($('<td></td>').html('分值比重：' + infoRawData + '%'));
            } else if (infoAttributes[ii] === 'student_upload') {
                infoRow.append($('<td></td>').html(infoRawData? '允许考生上传附件':'禁止考生上传附件'));
            } else if (infoAttributes[ii] === 'chance') {
                infoRow.append($('<td></td>').html('允许机会：' + infoRawData + '次'));
            } else if (infoAttributes[ii] === 'need_answer' && infoRawData) {
                infoRow.append($('<td></td>').html('本题不需要文字作答'));
            }
            $info.push(infoRow);
        }
    }
    // 5 - Buttons
    var $btnGroup = $('<div class="btn-group btn-group-sm"></div>');
    var $editBtn = $('<button type="button" class="btn btn-primary"></button>').text('修改');
    var $deleteBtn = $('<button type="button" class="btn btn-danger"></button>').text('删除');
    var $aBtn = $('<button type="button" class="btn btn-primary" disabled></button>').text('无附件');
    var $vBtn = $('<button type="button" class="btn btn-primary" disabled></button>').text('无视频');
    if (data.hasOwnProperty('attachment')) {
        $aBtn.attr('disabled', false);
        $aBtn.text('查看附件');
        $aBtn.click(function () {
            location.href = data['attachment'];
        });
    }
    if (data.hasOwnProperty('video')) {
        $vBtn.attr('disabled', false);
        $vBtn.text('视频暂时不支持播放');
    }
    $editBtn.click(function () {
        alert('抱歉，暂时不支持修改题目！');
    });
    $deleteBtn.click(function () {
        if (confirm('确认要删除本题？')) {
            location.href = ['', 'pool', 'delete_problem', ''].join('/') + codes.join('/') + '/';
        }
    });
    $btnGroup.append($aBtn, $vBtn, $editBtn, $deleteBtn);
    // Append
    var components = [$path, $index, $desc, $image, $choices, $ans, $answerImage, $info, $btnGroup];
    for (var i = 0; i < components.length; i++){
        if (components[i]){
            if (components[i] instanceof Array){
                for(var j = 0; j < components[i].length; j++){
                    $preview.append(components[i][j]);
                }
            } else {
                var row = $('<tr></tr>');
                var cell = $('<td></td>');
                cell.append(components[i]);
                row.append(cell);
                $preview.append(row);
            }
        }
    }
}

function setChapterInfo(pk) {
    var targets = ['#cell_chapter_name', '#cell_chapter_index'];
    var entries = ['full_path', 'full_index'];
    var specialTargets = [
        '#cell_chapter_image',
        '#id_smart_chapter_id', '#id_smart_chapter',
        '#id_group_d_chapter_id', '#id_group_d_chapter',
        '#id_group_e_chapter_id', '#id_group_e_chapter'
    ];
    var specialEntries = ['image_path', 'chapter', 'full_path', 'chapter', 'full_path', 'chapter', 'full_path'];
    var specialAttributes = ['src', 'value', 'value', 'value', 'value', 'value', 'value'];
    var i = 1;
    for (; i <= 7; i++) {
        targets.push('#cell_chapter_point' + i, '#cell_chapter_difficulty' + i);
        entries.push('point' + i, 'difficulty' + i);
    }
    if (pk === 0) { // reset
        for (i = 0; i < targets.length; i++) {
            var emptyCell = $(targets[i]);
            if (i < 2) emptyCell.text('请先选择一个章节');
            else emptyCell.html('');
        }
        $('#cell_chapter_image').attr('src', '/static/img/no_img.png');
        for (var j = 1; j < specialTargets.length; j++) {
            $(specialTargets[j]).val('');
        }
    } else {
        ajaxChangeTable('get_chapter', pk, targets, entries, specialTargets, specialEntries, specialAttributes);
    }
}

function changeFileInput(target, clear, msg) {
    var $target = $(target);
    if (clear) $target.val('');
    $target.next().text(msg);
}

function descriptionLink(description, pk, problemType) {
    var $fakeLink = $('<span class="fake-link"></span>').text(description);
    var $descCell = $('<td></td>');
    $descCell.append($fakeLink);
    $fakeLink.click(function () {
        ajaxChangeProblemPreview('get_problem', [problemType, pk], $fakeLink);
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
    var codes = [$('#id_category').val(), $('#id_subject').val(), $('#id_chapter').val()];
    var target = '#table_problem_set';
    ajaxChangeProblemTable('get_problem_set', codes, target);
});

$('#smart_add').click(function () {
    if ($('#id_chapter').val() === '0') {
        return alert('请先选择一个章节！');
    }
    $('#smart_add_collapse').collapse('toggle');
});

$('#form_smart_add').submit(function (event) {
    var smartId = $('#id_smart_chapter_id').val();
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
    var files = $(this)[0].files;
    changeFileInput('#id_smart_attachments', false, '已选择' + files.length + '个文件');
});

$('#id_smart_images').change(function () {
    var files = $(this)[0].files;
    changeFileInput('#id_smart_images', false, '已选择' + files.length + '张图片');
});

$('#id_smart_videos').change(function () {
    var files = $(this)[0].files;
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