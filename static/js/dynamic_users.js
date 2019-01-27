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

function resetForm() {
    $('#id_inf_username').val('');
    $('#id_inf_full_name').val('');
    $('#id_inf_area').val('');
    $('#id_inf_school').val('');
    $('#id_inf_department').val('');
    $("#id_access_card :input").prop('checked', false);
}


$('#id_inf_user').change(function () {
    var selectedUser = $('#id_inf_user').val();
    if (parseInt(selectedUser) === 0) {
        resetForm();
    } else {
        resetForm();
        $.ajax({
            url: ['', 'control', 'get_user', selectedUser, ''].join('/'),
            success: function (data) {
                $('#id_inf_username').val(data['username']);
                $('#id_inf_full_name').val(data['full_name']);
                $('#id_inf_area').val(data['area']);
                $('#id_inf_school').val(data['school']);
                $('#id_inf_department').val(data['department']);
                for (var permKey in data['permission']) {
                    if (data['permission'].hasOwnProperty(permKey)) {
                        $('#cb_' + permKey).prop('checked', data['permission'][permKey]);
                    }
                }
            }
        });
    }
});