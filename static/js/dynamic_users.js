$('#id_again_password').on('input', compareNewPasswords);
$('#id_new_password').on('input', compareNewPasswords);

function compareNewPasswords() {
    let newPwd = $('#id_new_password').val();
    let againPwd = $('#id_again_password').val();
    let btnSubmit = $('#btn_password');
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
    let selectedUser = $('#id_inf_user').val();
    let btnDel = $('#btn_del_user');
    let btnInit = $('#btn_init_pwd');
    if (parseInt(selectedUser) === 0) {
        resetForm();
        btnDel.attr('disabled', true);
        btnInit.attr('disabled', true);
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
                for (let permKey in data['permission']) {
                    if (data['permission'].hasOwnProperty(permKey)) {
                        $('#cb_' + permKey).prop('checked', data['permission'][permKey]);
                    }
                }
                btnDel.attr('disabled', false);
                btnInit.attr('disabled', false);
            }
        });
    }
});

$('#search_user').keyup(() => {
    let filter = $('#search_user').val().toUpperCase();
    let myList = $('#id_inf_user').children('option');
    for (let i = 1; i < myList.length; i++) {
        $(myList[i]).attr('hidden', $(myList[i]).text().toUpperCase().indexOf(filter) === -1);
    }
});