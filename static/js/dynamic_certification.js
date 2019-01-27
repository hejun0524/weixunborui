function copyLink(file_id) {
    var dummy = document.createElement('input');
    dummy.value = window.location.href + 'get/' + file_id + '/';
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert('已复制到粘贴板！');
}

function showButtons(e) {
    // Toggle
    var parentRow = $(e).parent();
    var buttons = parentRow.next();
    var isVisible = buttons.is(':visible');
    if (!isVisible) {
        buttons.attr('hidden', false);
        e.innerHTML = '<span class="fa fa-minus-circle fake-link-minus"></span>';
    } else {
        buttons.attr('hidden', true);
        e.innerHTML = '<span class="fa fa-plus-circle fake-link-plus"></span>';
    }
}

function changeFileInput(target, clear, msg) {
    var $target = $(target);
    if (clear) $target.val('');
    $target.next().text(msg);
}

function appendPlainTextTable($table, header, content, zeroMsg) {
    if (content.length === 0) {
        var zeroRow = $('<tr></tr>');
        var zeroCell = $('<td></td>').html('<span class="fa fa-thumbs-up"></span> ' + zeroMsg);
        zeroCell.attr('class', 'text-success');
        zeroRow.append(zeroCell);
        $table.append(zeroRow);
    } else {
        for (var i = 0; i < content.length; i++) {
            for (var j = 0; j < content[i].length; j++) {
                var row = $('<tr></tr>');
                var cell = $('<td></td>').html(header + content[i][j]);
                row.append(cell);
                $table.append(row);
            }
        }
    }
}

function digestPhotoNames(fileName) {
    var regExHyphen = /^(.*)-(.*)$/;
    var regExBlank = /^(.*)[\t\s]+(.*)$/;
    var regExNumbers = /^(\d+)(.*)$/;
    var regExArray;
    if (regExHyphen.test(fileName)) {
        regExArray = regExHyphen.exec(fileName);
        fileName = regExArray[1].trim() + regExArray[2].trim();
    }
    if (regExBlank.test(fileName)) {
        regExArray = regExBlank.exec(fileName);
        fileName = regExArray[1].trim() + regExArray[2].trim();
    }
    if (regExNumbers.test(fileName)) {
        regExArray = regExNumbers.exec(fileName);
        fileName = parseInt(regExArray[1].trim()).toString() + regExArray[2].trim();
    }
    return fileName;
}

function displayModal(action, type) {
    var translations = {
        'add': '添加',
        'edit': '修改',
        'category': '类别',
        'code': '科目代码'
    };
    var typeSc = translations[type];
    var actionSc = translations[action];
    var $selection = $('#id_m_' + type);
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
        if (selectedValue === '0' || selectedValue === null || selectedValue === undefined) {
            return alert('请选择一个' + typeSc + '！');
        }
        // Hidden field - object id
        $hiddenId.val(selectedValue);
        if (type === 'category') {
            ajaxChangeForm(
                'get_code_category', selectedValue,
                ['#id_category_name', '#id_category_index'],
                ['name', 'index']
            );
        } else if (type === 'code') {
            ajaxChangeForm(
                'get_code', selectedValue,
                ['#id_code_category', '#id_code_name', '#id_code_code', '#id_code_price', '#id_code_description'],
                ['category', 'name', 'code', 'price', 'description']
            );
        }
    }
    $('#' + type + '_modal').modal('show');
}

function ajaxChangeSelection(callerType, code, targets, entries) {
    /*
    callerType: what user clicked on - the component's model type;
    code: model id - i.e., caller's value;
    targets: a list of components that will be affected;
    entries: list, identify the data coming.
    fixedSelection: whether maintain the previous selection
     */
    $.ajax({
        url: ['', 'exam', callerType, code, ''].join('/'),
        success: function (data) {
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                $target.empty();
                $target.append($('<option selected disabled></option>').val(0).html('请选择'));
                $.each(data[entries[i]], function (index, text) {
                    $target.append($('<option></option>').val(text[0]).html(text[1]));
                });
            }
        }
    });
}

function ajaxChangeForm(callerType, code, targets, entries) {
    $.ajax({
        url: ['', 'exam', callerType, code, ''].join('/'),
        success: function (data) {
            for (var i = 0; i < targets.length; i++) {
                $(targets[i]).val(data[entries[i]]);
            }
        }
    });
}

function ajaxChangeTable(callerType, code, targets, entries) {
    $.ajax({
        url: ['', 'exam', callerType, code, ''].join('/'),
        success: function (data) {
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                $target.html(data[entries[i]]);
            }
        }
    });
}

function clearCodeTable() {
    ['#cell_code_category', '#cell_code_subject', '#cell_code_price', '#cell_code_description'].forEach(
        function (value) {
            $(value).html('请先选择一个代码科目');
        }
    );
}

$('#id_certification_photos').change(function () {
    var files = $(this)[0].files;
    changeFileInput('#id_certification_photos', false, '已选择' + files.length + '个文件');
});

$('#btn_reset_photos').click(function () {
    changeFileInput('#id_certification_photos', true, '上传照片（可多选）');
});

$('#search_student_list').click(function () {
    $('#student_list_modal').modal('show');
});

$('#btn_add_list').click(function () {
    var $list = $('#id_list_list');
    if ($list.val() === null) {
        return alert('请选择一个列表！');
    }
    $('#student_list_modal').modal('hide');
});

$('#btn_new_subject').click(function () {
    displayModal('add', 'code');
});

$('#id_code_category').change(function () {
    var $newCategory = $(this).parent().next();
    var $newIndex = $newCategory.next();
    var $inputName = $('#id_new_code_category');
    var $inputIndex = $('#id_new_code_category_index');
    if ($(this).val() === '0') {
        $newCategory.attr('hidden', false);
        $newIndex.attr('hidden', false);
        $inputName.attr('required', true);
        $inputIndex.attr('required', true);
    } else {
        $newCategory.attr('hidden', true);
        $newIndex.attr('hidden', true);
        $inputName.attr('required', false);
        $inputIndex.attr('required', false);
    }
});

$('#check_photos').click(function () {
    var studentListText = $.trim($('#id_students').val());
    var photos = $('#id_certification_photos');
    if (!studentListText) return alert('请输入学生列表！');
    if (!photos.val()) return alert('您未上传任何照片！');
    // Get all file names
    var files = photos.prop("files");
    var fileNames = $.map(files, function (val) {
        return val.name.substr(0, val.name.lastIndexOf('.')) || val.name;
    });
    // Get student list
    var studentList = studentListText.split(/[\r\n]+/);
    var necessary = {}, necessaryOrdered = [], extra = [], duplicates = [], i = 0;
    for (; i < studentList.length; i++) {
        var student = $.trim(studentList[i]);
        // Get desired file name
        var studentInfo = student.split('-');
        if (studentInfo.length !== 3) return alert('您的学生列表格式有误！位置：' + student);
        var desiredFileName = $.trim(studentInfo[0]) + $.trim(studentInfo[1]);
        necessary[desiredFileName] = {'info': student, 'has_file': false};
        necessaryOrdered.push(desiredFileName);
    }
    // Check files, get extra and duplicates
    for (i = 0; i < fileNames.length; i++) {
        var thisFileName = digestPhotoNames(fileNames[i].trim());
        if (necessary.hasOwnProperty(thisFileName)) {
            if (necessary[thisFileName]['has_file']) {
                duplicates.push([thisFileName]);
            } else {
                necessary[thisFileName]['has_file'] = true;
            }
        } else {
            extra.push([thisFileName]);
        }
    }
    // Constructs the table
    var $necessary = $('#necessary_photos'), $unnecessary = $('#unnecessary_photos');
    $necessary.html('');
    $unnecessary.html('');
    for (i = 0; i < necessaryOrdered.length; i++) {
        var thisStudentInfo = necessary[necessaryOrdered[i]]['info'];
        var row = $('<tr></tr>');
        var cell = $('<td></td>');
        if (necessary[necessaryOrdered[i]]['has_file']) {
            cell.html('<span class="fa fa-check-circle"></span> ' + thisStudentInfo);
            cell.attr('class', 'text-success');
        } else {
            cell.html('<span class="fa fa-times-circle"></span> ' + thisStudentInfo);
            cell.attr('class', 'text-danger');
        }
        row.append(cell);
        $necessary.append(row);
    }
    appendPlainTextTable($unnecessary, '[重复] ', duplicates, '没有重复的文件');
    appendPlainTextTable($unnecessary, '[多余] ', extra, '没有多余的文件');
    $('#photo_check_modal').modal('show');
});

$('#add_code').click(function () {
    displayModal('add', 'code');
});

$('#add_code_category').click(function () {
    displayModal('add', 'category');
});

$('#edit_code').click(function () {
    displayModal('edit', 'code');
});

$('#edit_code_category').click(function () {
    displayModal('edit', 'category');
});

$('#id_m_category').change(function () {
    clearCodeTable();
    ajaxChangeSelection('change_code_category', $('#id_m_category').val(), ['#id_m_code'], ['code_subjects']);
});


$('#id_m_code').change(function () {
    var selectedValue = $('#id_m_code').val();
    if (selectedValue === '0') {
        clearCodeTable();
    } else ajaxChangeTable(
        'get_code', selectedValue,
        ['#cell_code_category', '#cell_code_subject', '#cell_code_price', '#cell_code_description'],
        ['category_info', 'subject_info', 'price', 'description']
    );
});

$('#btn_load_list').click(function () {
    var selectedValue = $('#id_list_list').val();
    if (!selectedValue) return alert('请选择一个列表！');
    $.ajax({
        url: ['', 'exam', 'get_student_list', selectedValue, ''].join('/'),
        success: function (data) {
            var studentList = [];
            if (data.hasOwnProperty('student_list')) {
                var entries = Object.entries(data['student_list']);
                for (var i = 0; i < entries.length; i++) {
                    studentList.push(entries[i][0] + '-' + entries[i][1][0] + '-' + entries[i][1][1]);
                }
                $('#id_students').text(studentList.join('\r\n'));
                $('#student_list_modal').modal('hide');
            }
        }
    });
});
