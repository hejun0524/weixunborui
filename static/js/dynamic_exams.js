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

function ajaxChangeTable(requestApp, callerType, code, targets, entries, specialTargets, specialEntries, specialAttributes) {
    $.ajax({
        url: ['', requestApp, callerType, code, ''].join('/'),
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
                if (specialAttributes[j] === 'plan') {
                    $('#strategy_structure').html(''); // Re-select, clear
                    for (let k = 0; k < data[specialEntries[j]].length; k++) {
                        let planLine = data[specialEntries[j]][k];
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
            for (let i = 0; i < targets.length; i++) {
                let $target = $(targets[i]);
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
    let translations = {
        'add': '添加',
        'edit': '修改',
        'duplicate': '复制',
        'strategy': '策略'
    };
    let typeSc = translations[type];
    let actionSc = translations[action];
    let $selection = $('#id_' + type); // From main page, selection list
    let selectedValue = $selection.val();
    let $submitBtn = $('#btn_' + type); // Determine its name
    let $hiddenId = $('#id_' + type + '_id');
    let $modalTitle = $('#title_' + type);
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
            let targets = [
                '#id_strategy_category', '#id_strategy_subject',
                '#id_strategy_name', '#id_strategy_index', '#id_strategy_description', '#id_strategy_timer'
            ];
            let entries = ['category', 'subject', 'name', 'index', 'description', 'timer_num'];
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
    let targets = ['#cell_strategy_name', '#cell_strategy_index', '#cell_strategy_description', '#cell_strategy_timer'];
    let entries = ['full_path', 'full_index', 'description', 'timer'];
    let specialTargets = ['#id_selected_strategy', '#id_exam_strategy_id', '#id_exam_strategy', '#strategy_structure'];
    let specialEntries = ['strategy', 'strategy', 'full_path', 'plan'];
    let specialAttributes = ['value', 'value', 'value', 'plan'];
    $('#total_points').text(0);
    if (pk === 0) { // reset
        for (let i = 0; i < targets.length; i++) {
            let emptyCell = $(targets[i]);
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
    let targets = [];
    let entries = [];
    let specialTargets = ['#cell_chapter_image'];
    let specialEntries = ['image_path'];
    let specialAttributes = ['src'];
    let i = 1;
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
    let structure = $('#strategy_structure');
    let $totalPoints = $('#total_points');
    let row = $('<tr>');
    // Chapter name cell
    let nameCell = $('<td>').text(chapterName);
    nameCell.attr('rowspan', 2);
    // Button cell
    let functionCell = $('<td>');
    functionCell.attr('rowspan', 2);
    let upBtn = $('<span>').addClass('fa fa-arrow-circle-up fake-link text-primary mr-2');
    let downBtn = $('<span>').addClass('fa fa-arrow-circle-down fake-link text-primary mr-2');
    let deleteBtn = $('<span>').addClass('fa fa-trash-alt text-danger fake-link ml-5');
    let planString = $('<input type="text" readonly hidden>').val(JSON.stringify(planDetails));
    let planPointsInput = $('<input type="number" readonly hidden>').val(planPoints);
    upBtn.click(function () {
        let myRow = $(this).parent().parent();
        let myPointsRow = myRow.next('tr');
        let lastRow = myRow.prev('tr').prev('tr');
        let lastPointsRow = lastRow.next('tr');
        if (lastRow[0]) {
            myRow.after(myPointsRow);
            myPointsRow.after(lastRow);
            lastRow.after(lastPointsRow);
        } else {
            return alert('已是第一项！');
        }
    });
    downBtn.click(function () {
        let myRow = $(this).parent().parent();
        let myPointsRow = myRow.next('tr');
        let nextRow = myPointsRow.next('tr');
        let nextPointsRow = nextRow.next('tr');
        if (nextRow[0]) {
            nextPointsRow.after(myRow);
            myRow.after(myPointsRow);
        } else {
            return alert('已是最后一项！');
        }
    });
    deleteBtn.click(function () {
        let rowToDelete = $(this).parent().parent();
        let pointRowToDelete = rowToDelete.next('tr');
        rowToDelete.remove();
        pointRowToDelete.remove();
        $totalPoints.text(parseInt($totalPoints.text()) - planPoints);
    });
    functionCell.append(upBtn, downBtn, deleteBtn, planString, planPointsInput);
    // Append all cells to the row
    row.append(nameCell);
    let i;
    for (i = 1; i <= 7; i++) {
        row.append($('<td>').text(planDetails[i][0]));
    }
    row.append(functionCell);
    // Construct points row
    let pointsRow = $('<tr>');
    for (i = 1; i <= 7; i++) {
        pointsRow.append($('<td>').text(planDetails[i][1] + '分'));
    }
    // Append rows
    structure.append(row);
    structure.append(pointsRow);
    // Update total points
    $totalPoints.text(planPoints + parseInt($totalPoints.text()));
}

function appendPlainTextTable($table, header, content, zeroMsg) {
    if (content.length === 0) {
        let zeroRow = $('<tr></tr>');
        let zeroCell = $('<td></td>').html('<span class="fa fa-thumbs-up"></span> ' + zeroMsg);
        zeroCell.attr('class', 'text-success');
        zeroRow.append(zeroCell);
        $table.append(zeroRow);
    } else {
        for (let i = 0; i < content.length; i++) {
            for (let j = 0; j < content[i].length; j++) {
                let row = $('<tr></tr>');
                let cell = $('<td></td>').html(header + content[i][j]);
                row.append(cell);
                $table.append(row);
            }
        }
    }
}

function copyLink(file_id, is_exam) {
    let dummy = document.createElement('input');
    dummy.value = window.location.href + (is_exam ? 'get/' : 'get_list/') + file_id + '/';
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert('已复制到粘贴板！');
}

function showButtons(e) {
    // Toggle
    let parentRow = $(e).parent();
    let buttons = parentRow.next();
    let isVisible = buttons.is(':visible');
    if (!isVisible) {
        buttons.attr('hidden', false);
        e.innerHTML = '<span class="fa fa-minus-circle fake-link-minus"></span>';
    } else {
        buttons.attr('hidden', true);
        e.innerHTML = '<span class="fa fa-plus-circle fake-link-plus"></span>';
    }
}

function digestPhotoNames(fileName) {
    let regExHyphen = /^(.*)-(.*)$/;
    let regExBlank = /^(.*)[\t\s]+(.*)$/;
    let regExNumbers = /^(\d+)(.*)$/;
    let regExArray;
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
    let $target = $(target);
    if (clear) $target.val('');
    $target.next().text(msg);
}

function showPictureModal(action, pictureType, pictureId) {
    let $modal = $(`#${pictureType}_modal`);
    const translation = {
        'add': '添加',
        'edit': '编辑',
        'agreement': '考试须知图',
        'ad': '宣传图'
    };
    // Change title
    let modalTitle = `${translation[action]}${translation[pictureType]}`;
    $(`#${pictureType}_modal_title`).html(modalTitle);
    // Change id
    $(`#id_${pictureType}_id`).val(pictureId);
    // Change btn name
    let $btnPicture = $(`#btn_${pictureType}`);
    $btnPicture.html(`确认${translation[action]}`);
    $btnPicture.attr('name', `${action}_${pictureType}`);
    // Show or hide delete btn & preview
    $(`#delete_${pictureType}`).attr('hidden', action === 'add');
    $(`#${pictureType}_preview_card`).attr('hidden', action === 'add');
    // AJAX inputs and preview - clear all first
    let $name = $(`#id_${pictureType}_name`), $description = $(`#id_${pictureType}_description`);
    let $preview = $(`#${pictureType}_preview_2`), $checkBox = $(`#id_${pictureType}_changed`);
    $name.val('');
    $description.val('');
    $checkBox.attr('checked', false);
    $preview.attr('src', '');
    changeFileInput(`#id_${pictureType}_image`, true, '点击上传');
    if (action === 'edit') {
        $.ajax({
            url: `/exam/get_${pictureType}/${pictureId}/`,
            success: function (data) {
                $name.val(data['name']);
                $description.val(data['description']);
                $preview.attr('src', data['image_path']);
                changeFileInput(`#id_${pictureType}_image`, true, data['image']);
            }
        });
    }
    // Display modal
    $modal.modal('show');
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
    let chapterId = $('#id_chapter_chapter').val();
    let chapterName = $("#id_chapter_chapter option:selected").text();
    if (chapterId === '' || chapterId === null || chapterId === undefined) {
        return alert('请选择一个章节！');
    }
    let i = 1, planDetails = [parseInt(chapterId)], planPoint = 0;
    for (; i <= 7; i++) {
        let maxNumber = parseInt($('#cell_chapter_q_num' + i).text());
        let selectedNumber = parseInt($('#cell_chapter_selected_q_num' + i).val());
        let typePoints = parseInt($('#cell_chapter_point' + i).val());
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
    let $strategy = $('#id_selected_strategy');
    let $plan = $('#id_strategy_plan');
    let $sample = $('#id_sample_check');
    if ($strategy.val() === '') {
        return alert('请先选择一个策略！');
    }
    let $structure = $('#strategy_structure');
    let allPlanStrings = $structure.find('input[type="text"]');
    let finalJson = [];
    for (let i = 0; i < allPlanStrings.length; i++) {
        finalJson.push(JSON.parse(allPlanStrings[i]['value']));
    }
    $plan.val(JSON.stringify(finalJson));
    $sample.prop('checked', false);
    $('#form_save_structure').submit();
});

$('#generate_exam').click(function () {
    let $strategy = $('#id_strategy');
    if ($strategy.val() === '0') {
        return alert('请先选择一个策略！');
    }
    $('#generate_exam_collapse').collapse('toggle');
});

$('#generate_sample').click(function () {
    let $strategy = $('#id_selected_strategy');
    if ($strategy.val() === '') {
        return alert('请先选择一个策略！');
    }
    let $sample = $('#id_sample_check');
    $sample.prop('checked', true);
    $('#form_save_structure').submit();
});

$('#search_student_list').click(function () {
    $('#student_list_modal').modal('show');
});

$('#check_photos').click(function () {
    let studentListText = $.trim($('#id_students').val());
    let photos = $('#id_exam_photos');
    if (!studentListText) return alert('请输入学生列表！');
    if (!photos.val()) return alert('您未上传任何照片！');
    // Get all file names
    let files = photos.prop("files");
    let fileNames = $.map(files, function (val) {
        return val.name.substr(0, val.name.lastIndexOf('.')) || val.name;
    });
    // Get student list
    let studentList = studentListText.split(/[\r\n]+/);
    let necessary = {}, necessaryOrdered = [], extra = [], duplicates = [], i = 0;
    for (; i < studentList.length; i++) {
        let student = $.trim(studentList[i]);
        // Get desired file name
        let studentInfo = student.split('-');
        if (studentInfo.length !== 3) return alert('您的学生列表格式有误！位置：' + student);
        let desiredFileName = $.trim(studentInfo[0]) + $.trim(studentInfo[1]);
        necessary[desiredFileName] = {'info': student, 'has_file': false};
        necessaryOrdered.push(desiredFileName);
    }
    // Check files, get extra and duplicates
    for (i = 0; i < fileNames.length; i++) {
        let thisFileName = digestPhotoNames(fileNames[i].trim());
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
    let $necessary = $('#necessary_photos'), $unnecessary = $('#unnecessary_photos');
    $necessary.html('');
    $unnecessary.html('');
    for (i = 0; i < necessaryOrdered.length; i++) {
        let thisStudentInfo = necessary[necessaryOrdered[i]]['info'];
        let row = $('<tr></tr>');
        let cell = $('<td></td>');
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
    showPictureModal('add', 'agreement', 0);
});

$('#btn_new_ad').click(function () {
    showPictureModal('add', 'ad', 0);
});

$('#btn_new_agreement_2').click(function () {
    showPictureModal('add', 'agreement', 0);
});

$('#btn_new_ad_2').click(function () {
    showPictureModal('add', 'ad', 0);
});

$('#id_exam_photos').change(function () {
    let files = $(this)[0].files;
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
    $('#id_agreement_changed').attr('checked', true);
    $('#agreement_preview_card').attr('hidden', true);
    changeFileInput('#id_agreement_image', false, $(this).val());
});

$('#btn_reset_agreement').click(function () {
    $('#id_agreement_changed').attr('checked', false);
    $('#agreement_preview_card').attr('hidden', true);
    changeFileInput('#id_agreement_image', true, '点击上传');
});

$('#id_exam_ad').change(function () {
    ajaxChangeTable('exam', 'get_picture/ad',
        $(this).val(), [], [], ['#ad_preview'], ['image_path'], ['src']);
});

$('#id_ad_image').change(function () {
    $('#id_ad_changed').attr('checked', true);
    $('#ad_preview_card').attr('hidden', true);
    changeFileInput('#id_ad_image', false, $(this).val());
});

$('#btn_reset_ad').click(function () {
    $('#id_ad_changed').attr('checked', false);
    $('#ad_preview_card').attr('hidden', true);
    changeFileInput('#id_ad_image', true, '点击上传');
});

$('#btn_load_list').click(function () {
    let selectedValue = $('#id_list_list').val();
    if (!selectedValue) return alert('请选择一个列表！');
    $.ajax({
        url: ['', 'exam', 'get_student_list', selectedValue, ''].join('/'),
        success: function (data) {
            let studentList = [];
            if (data.hasOwnProperty('student_list')) {
                let entries = Object.entries(data['student_list']);
                for (let i = 0; i < entries.length; i++) {
                    studentList.push(entries[i][0] + '-' + entries[i][1][0] + '-' + entries[i][1][1]);
                }
                $('#id_students').text(studentList.join('\r\n'));
                $('#student_list_modal').modal('hide');
            }
        }
    });
});

$('#manage_pictures').click(function () {
    $('#manage_pictures_collapse').collapse('toggle');
});