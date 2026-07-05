$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

window.body = $('body');
window.ajaxModal = $('#ajaxModal');

body.on('submit', '.ajax_form', function(e) {
    e.preventDefault();
    sendAjaxWIthValidation($(this));
});

body.on('click', '.ajax_replace', function(e) {
    e.preventDefault();
    sendAjaxWIthValidation($(this));
});

body.on('input', '.ajax_input', function(e) {
    e.preventDefault();
    if($(this).val().length >= 3)
        sendAjaxWIthValidation($(this), {query: $(this).val()});
    else
        $('.hide_window').hide();
});
//ajax_modal
body.on('click', '.ajax_append', function(e) {
    e.preventDefault();
    var currentUrl, url, urlObj, hashObj, getParams, hash, data;
    currentUrl = window.location.href;
    url = $(this).attr('href');
    urlObj = currentUrl.includes("?") ? $.deparam.querystring(currentUrl) : {};
    hashObj = currentUrl.includes("#") ? $.deparam.fragment(currentUrl) : {};
    urlObj = url.includes("?") ? Object.assign(urlObj, $.deparam.querystring(url)) : urlObj;
    hashObj = url.includes("#") ? Object.assign(hashObj, $.deparam.fragment(url)) : hashObj;
    data = Object.assign({}, urlObj, hashObj);
    data.ajax = true;
    getParams = urlObj && Object.keys(urlObj).length ? '?' + $.param(urlObj) : '';
    hash = hashObj && Object.keys(hashObj).length ? '#' + $.param(hashObj) : '';
    window.history.pushState('page2', 'Title', getParams + hash);
    sendAjaxWIthValidation($(this), data);
});

var init = 0;
// MODALS
body.on('click', '.ajax_modal', function (e) {
    e.preventDefault();
    getAjaxModal($(this));
    // if ($(this).attr('data-action') === 'login' && init === 0){
    //     ajaxModal.modal('show');
    //
    //     ajaxModal.on('shown.bs.modal', function (e) {
    //         $(this).find('form').find('.form-group input.form-control').first().focus();
    //     });
    //
    // }else{
    //     getAjaxModal($(this));
    // }
});



function bodyLoad(){
    ajaxModal.load('/ajax/modal/getModalContent', {action: 'login', type: 'auth', item_id: 0, forItem: 0,
        forItem_id: 0, parameters: 0}, function (data) {
        //ajaxModal.modal('show');
        blockButton(ajaxModal);
        //email
    });
}

bodyLoad();


// Get info from object and send to modal window
function getAjaxModal(obj, params) {
    init = 1;
    if(params)
        history.pushState('', 'Title', '/');
    var action = params ? params.action : obj.attr('data-action');
    var type = params ? params.type : obj.attr('data-type');
    var item_id = obj.attr('data-id') ? obj.attr('data-id') : 0;
    var forItem = obj.attr('data-forItem') ? obj.attr('data-forItem') : 0;
    var forItem_id = obj.attr('data-forItem-id') ? obj.attr('data-forItem-id') : 0;
    var parameters = params ? params.parameters : (obj.attr('data-parameters') ? obj.attr('data-parameters') : 0);

    ajaxModal.remove();
    $('.modal-backdrop').remove();
    $('#ulogin_receiver_container').remove();
    ajaxModal.load('/ajax/modal/getModalContent', {action: action, type: type, item_id: item_id, forItem: forItem,
        forItem_id: forItem_id, parameters: parameters}, function (data) {
        ajaxModal.modal('show');
        blockButton(ajaxModal);
        //email
    });

    ajaxModal.on('shown.bs.modal', function (e) {

        var formContent = $('.login-form').html();

        $('.login-form').html(formContent);


        $(this).find('form').find('.form-group input.form-control').first().focus();

        //Add items to global lazyImages object of not yet shown images
        if(typeof lazyImages !== 'undefined')
            lazyImages.addItems('#ajaxModal .b-img-lazy img').update();

        //PRELOADER
        $('.spinner').fadeOut();
        $('#page-preloader').delay(350).fadeOut('slow');
    });

    ajaxModal.on('hidden.bs.modal', function (e) {
        ajaxModal.find('.modal-dialog').remove();
    });
}

function sendAjaxWIthValidation(self, data, method, url, callbackFunction) {
    if(!method)
        method = self.prop("tagName") === 'FORM' ? 'POST' : 'GET';
    if(self && method === 'POST') {
        url = url ? url : self.attr('action');
        data = data ? data : self.serialize();
        self.find('.form-group').removeClass('has-error');
        blockButton($('.ajax_form'));
    } else
        url = url ? url : self.attr('href');

    $.ajax({method: method, url: url, data: data }).done(function(resp) {
        var status, viewsAmount, viewName, content, action, paramsAmount;
        if($.type(resp) !== 'object') {
            status = parseJsonFromHtml(resp, "#status");
            viewsAmount = parseJsonFromHtml(resp, "#viewsAmount");
            paramsAmount = parseJsonFromHtml(resp, "#paramsAmount");
        } else
            status = resp;
        if(self && method === 'POST') {
            self.trigger('reset');
        }

        if (status.success === 1) {
            if (method === 'POST' && url.includes("auth/login")) {
                status.reload = true;
            }
            if(ajaxModal && status.modalWindow !== 'doNotHide')
                ajaxModal.modal('hide');
            if(status.text)
                alertify.success(status.text);
            if(viewsAmount)
                for (var i = 0; i < viewsAmount; i++) {
                    viewName = parseJsonFromHtml(resp, "#viewName-" + i);
                    content = parseJsonFromHtml(resp, "#content-" + i, 'notParsed');
                    action = parseJsonFromHtml(resp, "#viewName-" + i, 'getAction');
                    replaceAjaxContent(viewName, content, action, url);
                }
            if(paramsAmount) {
                implementParams(resp, ["#toggleClass", '#setValue', '#setAttr']);
            }
            if(status.reload || status.location || status.history)
                setTimeout(function () {
                    if(status.reload)
                        window.location.reload();
                    else if(status.location && window.location.pathname !== status.location)
                    // window.location = status.location;
                    //window.open(status.location, '_blank');
                        window.open(status.location, '_self');

                    else if(status.history)
                        window.history.pushState('page2', 'Title', status.history);
                }, status.timeOut ? status.timeOut : 0);
            if(callbackFunction)
                callbackFunction(resp);
        } else
            alertify.error(status.text);
    }).error(function (resp) {
        blockButton($('.ajax_form'), false);
        var errors = $.parseJSON(resp.responseText);
        self.find('*[name=' + Object.keys(errors)[0] + ']').closest('.form-group').addClass('has-error');
        self.find('*[name=' + Object.keys(errors)[0] + ']').focus();
        alertify.error(errors[Object.keys(errors)[0]][0]);
    });
}

function implementParams(resp, arrOfParams) {
    $.each(arrOfParams, function (k, param) {
        var action = parseJsonFromHtml(resp, param);
        if(action) {
            if(param === "#toggleClass")
                $.each(action, function (selector, className) {
                    $(selector).toggleClass(className);
                });
            if(param === "#setValue")
                $.each(action, function (selector, className) {
                    if($(selector).prop("tagName") === 'INPUT')
                        $(selector).val(className);
                    else
                        $(selector).text(className);
                });
            if(param === "#setAttr")
                $.each(action, function (selector, value) {
                    $(selector).attr(value[0], value[1]);
                });
        }
    });
}

function parseJsonFromHtml(html, id, custom) {
    if(!$($.parseHTML(html)).filter(id).length)
        return null;
    var parsed = custom === 'getAction' ? $($.parseHTML(html)).filter(id).attr('data-action') : $($.parseHTML(html)).filter(id).text();

    return custom === 'getAction' || custom === 'notParsed' ? parsed : $.parseJSON(parsed);
}

function replaceAjaxContent(view, content, action) {
    var view_arr = view.split('._');
    var prefix = view_arr[view_arr.length - 1];
    var replaced_block = $('.b-replaced_block_' + prefix);

    if(action === 'append') {
        replaced_block.append(content);
    } else {
        replaced_block.empty();
        replaced_block.html(content);
    }
}

// Block/unblock buttons
function blockButton(obj, status) {
    if(status !== false)
        obj.find('.m-changed_opacity').attr('disabled', 'disabled').css('opacity', 0.5).css('pointer-events', 'none');
    else
        obj.find('.m-changed_opacity').attr('disabled', false).css('opacity', 1).css('pointer-events', 'auto');
}

// clone a JavaScript object
function clone(obj) {
    if (null === obj || "object" !== typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

// Hide modal and other windows by outside click
body.click(function() {
    $('.hide_window').hide();
});

body.on('click', '.banner_link', function(e) {
    sendAjaxWIthValidation($(this), {id: $(this).attr('data-id')}, "GET", '/ajax/bannerClick')
});

body.on('click', 'input:radio', function(e) {

    if ($(this).val() == 'workers'){
        $('.register #name-label').html('ВАШЕ ИМЯ');
        $('.register #name').attr("placeholder", 'Укажите свое имя');
    } else if ($(this).val() == 'employers'){
        $('.register #name-label').html('НАЗВАНИЕ ВАШЕЙ КОМПАНИИ');
        $('.register #name').attr("placeholder", 'Укажите название вашей компании');
    }
    $(".ajax_form .b-replaced_block.b-replaced_block_registerBlock").show();
    $('.registration button').css('display', 'block');

});

$('.navbar-toggle').on('click', function () {


    if ($(this).hasClass('collapsed')){

        $('.navbar nav.navbar.navbar-fixed-top').css('background-color', '#03a9f4');

    }else{
        $('.navbar nav.navbar.navbar-fixed-top').css('background-color', 'transparent');
    }

});

