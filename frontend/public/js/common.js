$(document).ajaxComplete(loadCommon);
$(function () {loadCommon();});

function loadCommon() {
    // // Remove bg for tagBlocks
    // var tagBlocksBackgrounds = $(".b-img-flex");
    // if (tagBlocksBackgrounds.length > 0) {
    //     setTimeout(function () {
    //         tagBlocksBackgrounds.css({'height': 'auto', 'background': 'none'});
    //     }, 500);
    // }

    // Lazy load of images
    window.lazyImages = $('.b-img-lazy img').lazy({
        chainable: false,
        effect: "fadeIn",
        effectTime: 500,
        threshold: 0,
        afterLoad: function (element) {
            if(element.parent().hasClass('b-img-flex'))
                element.parent().css({'height': 'auto', 'background': 'none'});
        }
    });
}

// Use lazy load of images for tabs
body.on('click', '.nav_links li a', function (e) {
    setTimeout(function () {
        lazyImages.update(true);
    }, 250);
});

$(function () {
    $('.add_resume_modal').on('click', function (e) {
        e.preventDefault();
        $('#add_resume_modal').modal('toggle')
    });
    $('.add_vacancy_modal').on('click', function (e) {
        e.preventDefault();
        $('#add_vacancy_modal').modal('toggle')
    });

    /*
     * Send response on vacation
     * */
    $('.response_modal').on('click', function (e) {
        e.preventDefault();
        $('#responseModal').modal('toggle')
    });
    $('.get_contacts_modal').on('click', function (e) {
        e.preventDefault();
        $('#getContactsModal').modal('toggle')
    });
    $('.complain_modal').on('click', function (e) {
        e.preventDefault();
        $('#complainModal').modal('toggle')
    });
    $('.premium_priority_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#premiumPriorityModal_' + item_id).modal('toggle')
    });
    $('.premium_fixed_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#premiumFixedModal_' + item_id).modal('toggle')
    });
    $('.premium_hot_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#premiumHotModal_' + item_id).modal('toggle')
    });
    $('.premium_leading_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#premiumLeadingModal_' + item_id).modal('toggle')
    });
    $('.premium_post_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#premiumPostModal_' + item_id).modal('toggle')
    });
    $('.delete_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#deleteModal_' + item_id).modal('toggle')
    });
    $('.attached_modal').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');
        $('#attachedModal_' + item_id).modal('toggle')
    });

    $('#alerts_modal').modal('show');

     // Change language
    $('.lang').click(function () {
        window.location = $(this).data('target-page');
    });

     // Change location
    $('.loc').click(function () {
        var parameters = $(this).data('target-page');
        var categories_container = $('.training_categories');

        $.get('/ajax/training_categories', parameters, function (data) {
            categories_container.html(data);
        });
    });

    // Make Resume Hidden/Visible
    $('.res-hid').on('click', function (e) {
        e.preventDefault();
        var item_id = $(this).attr('data-id');

        $.get('/ajax/resumes/makeHidden', {item_id: item_id}, function (data) {
            if(data.is_hidden == true) {
                $('.hid-img_' + item_id).css('opacity', '0.3');
                $('.hid-link_' + item_id).attr('title', 'Показывать в списке резюме');
                $('#hide_modal_' + item_id).modal('toggle');
            }
            else if (data.is_hidden == false) {
                $('.hid-img_' + item_id).css('opacity', '1');
                $('.hid-link_' + item_id).attr('title', 'Скрыть в списке резюме');
                $('#show_modal_' + item_id).modal('toggle');
            }
        });
    });
});


// $(document).ready(function () {
//     $(window).bind('scroll', function () {
//         var navHeight = $(window).height() - 300;
//         console.log(navHeight);
//         if ($(window).scrollTop() > navHeight) {
//             $('.navbar').addClass('size');
//         } else {
//             $('.navbar').removeClass('size');
//         }
//     });
//
// });

// Upload File
$(function () {
    $('.uploadFile').each(function (index, item) {
        var $item = $(item);
        var $group = $item.closest('.form-group');
        var $errors = $item.find('.errors');
        var $noValue = $item.find('.no-value');
        var $hasValue = $item.find('.has-value');
        var $thumbnail = $item.find('.thumbnail img.has-value');
        var $input = $item.find('.imageValue');
        var flow = new Flow({
            target: $item.data('target'),
            testChunks: false,
            chunkSize: 1024 * 1024 * 1024,
            query: {
                _token: $item.data('token')
            }
        });

        //pdf, doc, docx
        flow.assignBrowse($item.find('.imageBrowse'), false, true, {
            accept: 'application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        flow.on('filesSubmitted', function (file) {
            flow.upload();
        });
        flow.on('fileSuccess', function (file, message) {
            flow.removeFile(file);

            $errors.html('');
            $group.removeClass('has-error');

            var result = $.parseJSON(message);
            $thumbnail.attr('src', result.url);
            $hasValue.find('span').text(result.value);
            $input.val(result.value);
            $noValue.addClass('hidden');
            $hasValue.removeClass('hidden');
        });
        flow.on('fileError', function (file, message) {
            flow.removeFile(file);

            var response = $.parseJSON(message);
            var errors = '';
            $.each(response, function (index, error) {
                errors += '<p class="help-block">' + error + '</p>'
            });
            $errors.html(errors);
            $group.addClass('has-error');
        });
        $item.find('.imageRemove').click(function () {
            $input.val('');
            $noValue.removeClass('hidden');
            $hasValue.addClass('hidden');
        });
    });
});

// Filter on vacancies, resumes, companies index page
$(function () {
    var form = $('.filter-form'), path;
    var filtered_container = $('.filtered_container');
    var show_more = $('.show_more');
    var type = show_more.attr('data-type');

    function submitFilterForm(page, action) {
        page = page || 1;
        if (type === 'vacancies')
            path = '/ajax/vacancies';
        else if (type === 'resumes')
            path = '/ajax/resumes';
        else if (type === 'companies')
            path = '/ajax/companies';
        $.get(path, form.serialize() + "&page=" + page, function (data) {
            if (action === 'append')
                filtered_container.append(data);
            else
                filtered_container.html(data);
            $('.total_entries').html(filtered_container.find('.total').html());
            show_more.show();
            if (filtered_container.find('.show_load_more').last().html() == '0') {
                show_more.hide();
            }
        });
    }

    var item_input = $('.filter-input');

    item_input.on('input', function (e) {
        submitFilterForm();
    });

    $('.filter-select').on('change', submitFilterForm);

    $('body').on('click', '.show_more', function (e) {
        e.preventDefault();
        var self = $(this);
        var page = self.attr('data-page');
        self.attr('data-page', parseInt(page) + 1);
        submitFilterForm(self.attr('data-page'), 'append');
    });

    if(form.length)
        submitFilterForm();
});

// Datepicker
$(function () {
    $(".datepicker").datepicker({
        autoclose: true,
        format: 'dd.mm.yyyy'
    });
});

// Closing window event
$(function () {
    var createEditPage = $(".create-edit-page");

    if (createEditPage.length > 0) {
        var inFormOrLink;
        // $('a').on('click', function() { inFormOrLink = true; });
        $('form').on('submit', function() { inFormOrLink = true; });

        $(window).on('beforeunload', function(eventObject) {
            var returnValue = undefined;
            if (! inFormOrLink) {
                returnValue = "Do you really want to close?";
            }
            eventObject.returnValue = returnValue;
            return returnValue;
        });
    }
});