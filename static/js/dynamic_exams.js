function ajaxChangeSelection(callerType, code, targets, has0, entries, fixedSelection) {
    /*
    callerType: what user clicked on - the component's model type;
    code: model id - i.e., caller's value;
    targets: a list of components that will be affected;
    has0: list, if true, append option "0 - all", if false append "null - select...", else ignore.
    entries: list, identify the data coming.
    fixedSelection: whether maintain the previous selection
     */
    $.ajax({
        url: ['', 'exam', callerType, code, ''].join('/'),
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

$('#add_strategy').click(function () {
    $('#strategy_modal').modal('show');
});

$('#id_category').change(function () {
    ajaxChangeSelection(
        'change_category', $(this).val(),
        ['#id_subject', '#id_strategy'], [true, true], ['subjects', 'strategies'], false
    );
});

$('#id_subject').change(function () {
    ajaxChangeSelection(
        'change_subject/' + $('#id_category').val(), $(this).val(),
        ['#id_strategy'], [true], ['strategies'], false
    );
});

$('#id_strategy_category').change(function () {
    ajaxChangeSelection(
        'change_category', $(this).val(),
        ['#id_strategy_subject'], [false], ['subjects'], false
    );
});

