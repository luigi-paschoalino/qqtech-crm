$(document).ready(function() {
    $('#submit').click(function() {
        sessionStorage.setItem('matricula', $('[name="matricula"]').val());
        sessionStorage.setItem('senha', $('[name="senha"]').val());
    });
});