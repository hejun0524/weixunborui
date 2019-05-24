$('#id_file').change(function () {
    let fileName = $(this).val();
    $(this).next('.custom-file-label').html(fileName);
});

$('#btn_reset').click(function () {
    let inputFile = $('#id_file');
    inputFile.prop('value', '');
    inputFile.next('.custom-file-label').html('上传附件');
});

function copyLink(file_id) {
    let dummy = document.createElement('input');
    dummy.value = window.location.href + 'get/' + file_id + '/';
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

$('#btn_clean_cache').click(function () {
    let $btn = $('#btn_clean_cache');
    $.ajax({
        url: ['', 'control', 'clean_cache'].join('/'),
        success: function (data) {
            $btn.attr('class', 'btn btn-sm btn-outline-success');
            $btn.text('已清理');
        }
    });
});