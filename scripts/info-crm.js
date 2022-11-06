$(document).ready(function() {
    $('input[type="radio"]').click(function() { 
        $("#feedbackJust").prop("disabled", true);
        if ($(this).attr('value') == 'reprovado') {
            $("#feedbackJust").prop("disabled", false);
        }
    });
});