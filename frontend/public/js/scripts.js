$('.page .toggle-eye').on('click', function () {
    var $icon = $(this);
    var $input = $icon.siblings('input');

    if ($input.attr('type') === 'password') {
        $input.attr('type', 'text');
        $icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
        $input.attr('type', 'password');
        $icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
});

$('#date_of_birth_icon').click(function (e) {

    //$("#datetimepicker5 #date").datepicker("show");

    $("#datetimepicker5.bdate").datepicker("show");
    $("#datetimepicker5.ex-date").datepicker("show");
    $("#datetimepicker5 .datepicker").datepicker("show");
});

$('#expires_at_icon').click(function (e) {
    $("#datetimepicker5 .datepicker").datepicker("show");
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip({
        html: true,
    });

    $('a.super').click(function () {
        $('a').tooltip({placement: 'top',trigger: ''}).tooltip('hide');
    });

    //$('a').tooltip({placement: 'top',trigger: ''}).tooltip('show');

    $('.payment-types .payment-item a').click(function (e) {

        var type = $(this).attr('data-type');

        $('#payment-type').val(type);

        $('.online-payment .payment-summ').css('display', 'grid');
        $('.payment-instruction').css('display', 'inline-block');

        $('.payment-instruction .instruction').hide();
        $('.payment-instruction .instruction.'+type).show();


        $([document.documentElement, document.body]).animate({
            scrollTop: $(".payment-instruction").offset().top - 60
        }, 800);


    });

    $('.online-payment .no-cash .payment-item').click(function (e) {
        $('.payment-instruction .instruction').css('display', 'none');
        $('.online-payment .payment-summ').css('display', 'none');
        $('.payment-instruction').css('display', 'inline-block');
        $(' .instruction.cassless').show();

    });



    let url = window.location.href;

    var arr = url.split('?');

    if (url.length > 1 && arr[1] === 'lang=2') {
        $([document.documentElement, document.body]).animate({
            scrollTop: $(".payment-instruction").offset().top - 60
        }, 800);
    }



    $('#payment-amount').keydown(function(e)
    {
        var key = e.charCode || e.keyCode || 0;

        return (
            key == 8 ||
            key == 9 ||
            key == 13 ||
            key == 46 ||
            key == 110 ||
            key == 190 ||
            (key >= 35 && key <= 40) ||
            (key >= 48 && key <= 57) ||
            (key >= 96 && key <= 105));
    });

    $(document).on('change', '#modal-hr-block input[type=radio][name=duration]', function (event) {
        var balance = $('#modal-hr-block').attr('data-balance');
        var sum = $(this).attr('data-sum');
        $('#usre-balance').html(balance);
        $('#hr-sum').html(sum);

        balance = parseInt(balance);
        sum = parseInt(sum);

        if (balance < sum) {
            $('#balance-message').removeClass('hide');
            $('#balance-message').addClass('show');

            $('#btn-balance').removeClass('hide').addClass('show');
            $('#bnt-pay').removeClass('show').addClass('hide');

        }else{
            $('#balance-message').addClass('hide');
            $('#balance-message').removeClass('show');


            $('#btn-balance').removeClass('show').addClass('hide');
            $('#bnt-pay').removeClass('hide').addClass('show');
        }
    });
});


if ($('.indexcategory').length){
    var distance = $('.indexcategory').offset().top - 100, $window = $(window);

    $window.scroll(function() {
        if ( $window.scrollTop() >= distance) {
            $('.navbar nav.navbar.navbar-fixed-top').stop(true,true).addClass('blue-navbar', 3000);
        }else{
            $('.navbar nav.navbar.navbar-fixed-top').stop(true,true).removeClass('blue-navbar', 3000);
        }
    });
}