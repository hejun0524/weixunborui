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

$('#btn_add_list').click(function () {
    var $list = $('#id_list_list');
    if ($list.val() === null) {
        return alert('请选择一个列表！');
    }
    $('#student_list_modal').modal('hide');
});

$('#search_subject').click(function () {
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