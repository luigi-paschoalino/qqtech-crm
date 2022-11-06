$(document).ready(function() {
    $('.changelogDesc').each(function() {
        $(this).click(function() {
            $(this).children('.changelogDescContent').toggle();
        });
    });
});