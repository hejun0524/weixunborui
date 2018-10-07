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
        targets.push('#cell_chapter_point' + i, '#cell_chapter_difficulty' + i, '#cell_chapter_q_num' + i);
        entries.push('point' + i, 'difficulty' + i, 'q_num' + i);
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
    // Button cell
    var functionCell = $('<td>');
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
    for (var i = 1; i <= 7; i++) {
        row.append($('<td>').text(planDetails[i]));
    }
    row.append(functionCell);
    structure.append(row);
    // Update total points
    $totalPoints.text(planPoints + parseInt($totalPoints.text()));
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
        var typePoints = parseInt($('#cell_chapter_point' + i).text());
        if (selectedNumber < 0 || selectedNumber > maxNumber) {
            return alert('选择的题目数量不符合要求！');
        }
        planPoint += typePoints * selectedNumber;
        planDetails.push(selectedNumber);
    }
    appendPlanLine(chapterName, planDetails, planPoint);
    $('#chapter_modal').modal('hide');
});

$('#id_save_structure').click(function () {
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
