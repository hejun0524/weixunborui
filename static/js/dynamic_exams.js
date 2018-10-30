function ajaxChangeSelection(requestApp, callerType, code, targets, has0, entries, fixedSelection) {
    /*
    requestApp: pool, exam or whatever;
    callerType: what user clicked on - the component's model type;
    code: model id - i.e., caller's value;
    targets: a list of components that will be affected;
    has0: list, if true, append option "0 - all", if false append "null - select...", else ignore.
    entries: list, identify the data coming.
    fixedSelection: whether maintain the previous selection
     */
    $.ajax({
        url: ['', requestApp, callerType, code, ''].join('/'),
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

function ajaxChangeTable(requestApp, callerType, code, targets, entries, specialTargets, specialEntries, specialAttributes) {
    $.ajax({
        url: ['', requestApp, callerType, code, ''].join('/'),
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
                if (specialAttributes[j] === 'plan') {
                    $('#strategy_structure').html(''); // Re-select, clear
                    for (var k = 0; k < data[specialEntries[j]].length; k++) {
                        var planLine = data[specialEntries[j]][k];
                        appendPlanLine(planLine['chapter_name'], planLine['plan_list'], planLine['list_total_points']);
                    }
                    continue;
                }
                sTarget.attr(specialAttributes[j], data[specialEntries[j]]);
            }
        }
    });
}

function ajaxChangeForm(requestApp, callerType, code, targets, entries, isDuplication) {
    $.ajax({
        url: ['', requestApp, callerType, code, ''].join('/'),
        success: function (data) {
            for (var i = 0; i < targets.length; i++) {
                var $target = $(targets[i]);
                if (entries[i] === 'name' && isDuplication) {
                    $target.val(data[entries[i]] + ' - 拷贝');
                } else if (entries[i] === 'index' && isDuplication) {
                    $target.val(data[entries[i]] + 'COPY');
                } else {
                    $target.val(data[entries[i]]);
                }
            }
        }
    });
}

function displayModal(action, type) {
    var translations = {
        'add': '添加',
        'edit': '修改',
        'duplicate': '复制',
        'strategy': '策略'
    };
    var typeSc = translations[type];
    var actionSc = translations[action];
    var $selection = $('#id_' + type); // From main page, selection list
    var selectedValue = $selection.val();
    var $submitBtn = $('#btn_' + type); // Determine its name
    var $hiddenId = $('#id_' + type + '_id');
    var $modalTitle = $('#title_' + type);
    $submitBtn.attr('name', action + '_' + type);
    $submitBtn.text('确认' + actionSc);
    $hiddenId.val('');
    $modalTitle.text(actionSc + typeSc);
    $('#delete_' + type).attr('hidden', action !== 'edit');
    // Selection violation
    if (action === 'edit' || action === 'duplicate') {
        if (selectedValue === '0') {
            return alert('请选择一个' + typeSc + '！');
        }
        // Hidden field - object id
        $hiddenId.val(selectedValue);
        if (type === 'strategy') {
            var targets = [
                '#id_strategy_category', '#id_strategy_subject',
                '#id_strategy_name', '#id_strategy_index', '#id_strategy_description', '#id_strategy_timer'
            ];
            var entries = ['category', 'subject', 'name', 'index', 'description', 'timer_num'];
            ajaxChangeForm('exam', 'get_strategy', selectedValue, targets, entries, action === 'duplicate');
            ajaxChangeSelection(
                'pool', 'change_category', $('#id_strategy_category').val(),
                ['#id_strategy_subject'], [false], ['subjects'], true
            );
        }
    }
    $('#' + type + '_modal').modal('show');
}

function setStrategyInfo(pk) {
    var targets = ['#cell_strategy_name', '#cell_strategy_index', '#cell_strategy_description', '#cell_strategy_timer'];
    var entries = ['full_path', 'full_index', 'description', 'timer'];
    var specialTargets = ['#id_selected_strategy', '#id_exam_strategy_id', '#id_exam_strategy', '#strategy_structure'];
    var specialEntries = ['strategy', 'strategy', 'full_path', 'plan'];
    var specialAttributes = ['value', 'value', 'value', 'plan'];
    $('#total_points').text(0);
    if (pk === 0) { // reset
        for (var i = 0; i < targets.length; i++) {
            var emptyCell = $(targets[i]);
            emptyCell.text('请先选择一个章节');
        }
        $('#id_selected_strategy').val('');
        $('#id_exam_strategy_id').val('');
        $('#id_exam_strategy').val('');
        $('#strategy_structure').html('');
    } else {
        ajaxChangeTable('exam', 'get_strategy', pk, targets, entries, specialTargets, specialEntries, specialAttributes);
    }
}

function setChapterInfo(pk) {
    var targets = [];
    var entries = [];
    var specialTargets = ['#cell_chapter_image'];
    var specialEntries = ['image_path'];
    var specialAttributes = ['src'];
    var i = 1;
    for (; i <= 7; i++) {
        specialTargets.push('#cell_chapter_point' + i);
        specialEntries.push('point' + i);
        specialAttributes.push('value');
        targets.push('#cell_chapter_difficulty' + i, '#cell_chapter_q_num' + i);
        entries.push('difficulty' + i, 'q_num' + i);
        $('#cell_chapter_selected_q_num' + i).val(0);
    }
    if (pk === 0) { // reset
        for (i = 0; i < targets.length; i++) {
            $(targets[i]).html('');
        }
        $('#cell_chapter_image').attr('src', '/static/img/no_img.png');
    } else {
        ajaxChangeTable('pool', 'get_chapter', pk, targets, entries, specialTargets, specialEntries, specialAttributes);
    }
}

function appendPlanLine(chapterName, planDetails, planPoints) {
    var structure = $('#strategy_structure');
    var $totalPoints = $('#total_points');
    var row = $('<tr>');
    // Chapter name cell
    var nameCell = $('<td>').text(chapterName);
    nameCell.attr('rowspan', 2);
    // Button cell
    var functionCell = $('<td>');
    functionCell.attr('rowspan', 2);
    var upBtn = $('<span>').addClass('fa fa-arrow-circle-up fake-link text-primary mr-2');
    var downBtn = $('<span>').addClass('fa fa-arrow-circle-down fake-link text-primary mr-2');
    var deleteBtn = $('<span>').addClass('fa fa-trash-alt text-danger fake-link ml-5');
    var planString = $('<input type="text" readonly hidden>').val(JSON.stringify(planDetails));
    var planPointsInput = $('<input type="number" readonly hidden>').val(planPoints);
    upBtn.click(function () {
        var myRow = $(this).parent().parent();
        var lastRow = myRow.prev('tr');
        if (lastRow[0]) {
            myRow.after(lastRow);
        } else {
            return alert('已是第一项！');
        }
    });
    downBtn.click(function () {
        var myRow = $(this).parent().parent();
        var nextRow = myRow.next('tr');
        if (nextRow[0]) {
            myRow.before(nextRow);
        } else {
            return alert('已是最后一项！');
        }
    });
    deleteBtn.click(function () {
        var rowToDelete = $(this).parent().parent();
        rowToDelete.remove();
        $totalPoints.text(parseInt($totalPoints.text()) - planPoints);
    });
    functionCell.append(upBtn, downBtn, deleteBtn, planString, planPointsInput);
    // Append all cells to the row
    row.append(nameCell);
    row.append(functionCell);
    var i;
    for (i = 1; i <= 7; i++) {
        row.append($('<td>').text(planDetails[i][0]));
    }
    structure.append(row);
    // Append points row
    var pointsRow = $('<tr>');
    for (i = 1; i <= 7; i++) {
        pointsRow.append($('<td>').text(planDetails[i][1] + '分'));
    }
    structure.append(pointsRow);
    // Update total points
    $totalPoints.text(planPoints + parseInt($totalPoints.text()));
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

function changeFileInput(target, clear, msg) {
    var $target = $(target);
    if (clear) $target.val('');
    $target.next().text(msg);
}

$('#add_strategy').click(function () {
    displayModal('add', 'strategy');
});

$('#edit_strategy').click(function () {
    displayModal('edit', 'strategy');
});

$('#duplicate_strategy').click(function () {
    displayModal('duplicate', 'strategy');
});

$('#add_chapter').click(function () {
    if (parseInt($('#id_strategy').val()) === 0) {
        return alert('请先选择一个策略！');
    }
    $('#chapter_modal').modal('show');
});

$('#id_category').change(function () {
    ajaxChangeSelection(
        'exam', 'change_category', $(this).val(),
        ['#id_subject', '#id_strategy'], [true, true], ['subjects', 'strategies'], false
    );
});

$('#id_subject').change(function () {
    ajaxChangeSelection(
        'exam', 'change_subject/' + $('#id_category').val(), $(this).val(),
        ['#id_strategy'], [true], ['strategies'], false
    );
});

$('#id_strategy').change(function () {
    setStrategyInfo(parseInt($(this).val()));
});

$('#id_strategy_category').change(function () {
    ajaxChangeSelection(
        'exam', 'change_category', $(this).val(),
        ['#id_strategy_subject'], [false], ['subjects'], false
    );
});

$('#id_chapter_category').change(function () {
    ajaxChangeSelection(
        'pool', 'change_category', $(this).val(),
        ['#id_chapter_subject', '#id_chapter_chapter'], [true, false], ['subjects', 'chapters'], false
    );
    setChapterInfo(0);
});

$('#id_chapter_subject').change(function () {
    ajaxChangeSelection(
        'pool', 'change_subject/' + $('#id_chapter_category').val(), $(this).val(),
        ['#id_chapter_chapter'], [false], ['chapters'], false
    );
    setChapterInfo(0);
});

$('#id_chapter_chapter').change(function () {
    setChapterInfo(parseInt($(this).val()));
});

$('#btn_add_chapter').click(function () {
    var chapterId = $('#id_chapter_chapter').val();
    var chapterName = $("#id_chapter_chapter option:selected").text();
    if (chapterId === '' || chapterId === null || chapterId === undefined) {
        return alert('请选择一个章节！');
    }
    var i = 1, planDetails = [parseInt(chapterId)], planPoint = 0;
    for (; i <= 7; i++) {
        var maxNumber = parseInt($('#cell_chapter_q_num' + i).text());
        var selectedNumber = parseInt($('#cell_chapter_selected_q_num' + i).val());
        var typePoints = parseInt($('#cell_chapter_point' + i).val());
        if (selectedNumber < 0 || selectedNumber > maxNumber) {
            return alert('选择的题目数量不符合要求！');
        }
        planPoint += typePoints * selectedNumber;
        planDetails.push([selectedNumber, typePoints]);
    }
    appendPlanLine(chapterName, planDetails, planPoint);
    $('#chapter_modal').modal('hide');
});

$('#save_structure').click(function () {
    var $strategy = $('#id_selected_strategy');
    var $plan = $('#id_strategy_plan');
    if ($strategy.val() === '') {
        return alert('请先选择一个策略！');
    }
    var $structure = $('#strategy_structure');
    var allPlanStrings = $structure.find('input[type="text"]');
    var finalJson = [];
    for (var i = 0; i < allPlanStrings.length; i++) {
        finalJson.push(JSON.parse(allPlanStrings[i]['value']));
    }
    $plan.val(JSON.stringify(finalJson));
    $('#form_save_structure').submit();
});

$('#generate_exam').click(function () {
    var $strategy = $('#id_strategy');
    if ($strategy.val() === '0') {
        return alert('请先选择一个策略！');
    }
    $('#generate_exam_collapse').collapse('toggle');
});

$('#search_student_list').click(function () {
    $('#student_list_modal').modal('show');
});

$('#check_photos').click(function () {
    var studentListText = $.trim($('#id_students').val());
    var photos = $('#id_exam_photos');
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

$('#btn_new_agreement').click(function () {
    $('#agreement_modal').modal('show');
});

$('#btn_new_ad').click(function () {
    $('#ad_modal').modal('show');
});

$('#id_exam_photos').change(function () {
    var files = $(this)[0].files;
    changeFileInput('#id_exam_photos', false, '已选择' + files.length + '个文件');
});

$('#btn_reset_photos').click(function () {
    changeFileInput('#id_exam_photos', true, '上传照片（可多选）');
});

$('#id_exam_agreement').change(function () {
    ajaxChangeTable('exam', 'get_picture/agreement',
        $(this).val(), [], [], ['#agreement_preview'], ['image_path'], ['src']);
});

$('#id_agreement_image').change(function () {
    changeFileInput('#id_agreement_image', false, $(this).val());
});

$('#btn_reset_agreement').click(function () {
    changeFileInput('#id_agreement_image', true, '点击上传');
});

$('#id_exam_ad').change(function () {
    ajaxChangeTable('exam', 'get_picture/ad',
        $(this).val(), [], [], ['#ad_preview'], ['image_path'], ['src']);
});

$('#id_ad_image').change(function () {
    changeFileInput('#id_ad_image', false, $(this).val());
});

$('#btn_reset_ad').click(function () {
    changeFileInput('#id_ad_image', true, '点击上传');
});