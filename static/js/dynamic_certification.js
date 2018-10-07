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
    $('#code_modal').modal('show');
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
        var thisFileName = fileNames[i];
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