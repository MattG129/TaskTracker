$(function() {
    $('#NextCaratPackRenewalDate').mask("00/00/0000", {placeholder: 'mm/dd/yyyy' }).datepicker({
        changeMonth: true,
        changeYear: true,
        showOn: "button",
        buttonText: '',
        minDate: 'today'
    }).on('change', function() {
        $(this).trigger('input');
        $('#NextCaratPackRenewalDate').parsley().validate(); // For some reason parsley text won't show up without this.
    });

    $(".ui-datepicker-trigger").append('<i class="bi bi-calendar"></i>')
});