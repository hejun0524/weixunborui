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

$('#search_subject').click(function () {
    $('#subject_modal').modal('show');
});

$('#btn_add_list').click(function () {
    var $list = $('#id_list_list');
    if ($list.val() === null) {
        return alert('请选择一个列表！');
    }
    $('#student_list_modal').modal('hide');
});

$('#btn_add_subject').click(function () {
    var $subject = $('#id_subject_subject');
    if ($subject.val() === null) {
        return alert('请选择一个科目！');
    }
    $('#id_certification_subject').val($('#id_subject_subject option:selected').text());
    $('#subject_modal').modal('hide');
});