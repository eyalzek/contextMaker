$(document).ready(function() {
    $('.add').on('click', function(e) {
        var i = $('.urlInput').length;
            newInput = $('<input>', {class: 'urlInput', id: 'url' + i, type: 'text', placeholder: 'Enter url'});

        $(newInput).appendTo('.inputContainer').after('<br/>');
    });

    $('.load').on('click', function(e) {
        var values = [];

        $('.load').prop('disabled', true);
        $('.load').html('creating context image...');
        $('.urlInput').each(function(i, el) {
            if ($(el).val() !== "") values.push($(el).val());
        });

        $.post('/makeScreenshots', {data: values}, function(data, textStatus, xhr) {
            console.log('context image created');
            console.log(data);
            window.location.href = data;
        });
    });
});
