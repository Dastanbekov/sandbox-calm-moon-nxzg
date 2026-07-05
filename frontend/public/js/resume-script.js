$(function () {

    $('body').on('click', '.remove_block', function (e) {
        var self = $(this);
        if (self.closest('.dynamic_container').children().length <= self.data('max-blocks'))
            self.closest('.dynamic_container').next().show();
        if (self.closest('.dynamic_container').children().length <= 1)
            return false;
        self.closest('.dynamic_block').remove();
        hideFirstChild();


    });

    hideFirstChild();


    function hideFirstChild() {

        $('.dynamic_container').each(function(i, obj) {

            var dynamic_block = $(obj).find('.dynamic_block');

            if (dynamic_block.size() > 1){
                $(this).find('.remove_block').show();
            }else{
                $(this).find('.remove_block').hide();
            }

        });

    }

    /*
     * Disables exp_end_work if user is still working in that company on resume create/edit page
     * */
    $('body').on('change', '.is_working_checkbox', function () {
        var self = $(this);
        if (self.is(":checked")) {
            self.closest('.form-group').next().find('input[type=date]').attr("disabled", true);
        } else {
            self.closest('.form-group').next().find('input[type=date]').attr("disabled", false);
        }
    });

    $('.add_dynamic_block').on('click', function (e) {


        var self = $(this);
        var container = self.prev();
        /*$('.dynamic_container');*/
        var block = self.prev().find('.dynamic_block').first().clone().appendTo(container);
        block.find("input[type='text']").val("");
        block.find("textarea").val("");
        block.find("input[type='checkbox']").prop("checked", false);
        block.find('.help-block').remove();
        block.find('*').removeClass('has-error');

        if (self.prev().children().length >= self.data('max-blocks'))
            self.hide();

        $(".datepicker").datepicker({
            autoclose: true,
            format: 'dd.mm.yyyy'
        });


        hideFirstChild();
    });
});