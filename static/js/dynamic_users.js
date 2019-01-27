$('#id_again_password').on('input', compareNewPasswords);
$('#id_new_password').on('input', compareNewPasswords);

function compareNewPasswords() {
    var newPwd = $('#id_new_password').val();
    var againPwd = $('#id_again_password').val();
    var btnSubmit = $('#btn_password');
    if (newPwd !== againPwd) {
        $(this).attr('class', 'col-sm-9 form-control form-control-sm form-control-danger');
        btnSubmit.attr('disabled', true);
    } else {
        $(this).attr('class', 'col-sm-9 form-control form-control-sm form-control-success');
        btnSubmit.attr('disabled', false);
    }
}