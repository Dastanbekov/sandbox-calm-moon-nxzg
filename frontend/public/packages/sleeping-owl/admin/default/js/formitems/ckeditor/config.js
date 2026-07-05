/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
    // Define changes to default configuration here.
    // For complete reference see:
    // http://docs.ckeditor.com/#!/api/CKEDITOR.config

    // Toolbar configuration generated automatically by the editor based on config.toolbarGroups.
    config.toolbar = [
        { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
        //{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
        //{ name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
        //'/',
        { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
        { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
        { name: 'links', items: [ 'Link', 'Unlink'/*, 'Anchor' */] },
        { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'Youtube' /*'PageBreak', 'Iframe'*/ ] },
        //'/',
        { name: 'styles', items: [ /*'Styles', */ 'Format', 'Font', 'FontSize' ] },
        { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
        { name: 'tools', items: [ 'Maximize'/*, 'ShowBlocks'*/ ] },
        { name: 'others', items: [ '-' ] },
        //{ name: 'about', items: [ 'About' ] }
        { name: 'document', /*groups: [ 'mode', 'document', 'doctools' ],*/ items: [ 'Source'/*, '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates' */] },
    ];

    // Remove some buttons provided by the standard plugins, which are
    // not needed in the Standard(s) toolbar.
    config.removeButtons = 'Underline,Subscript,Superscript';

    // Set the most common block elements.
    config.format_tags = 'p;h1;h2;h3;pre';

    // Simplify the dialog windows.
    config.removeDialogTabs = 'image:advanced;link:advanced';

    CKEDITOR.config.simpleImageBrowserURL = '/' + window.admin.prefix + '/assets/images/all';
    CKEDITOR.config.language = window.admin.locale;
    config.filebrowserImageUploadUrl = '/' + window.admin.prefix + '/assets/images/upload';

    $.extend(config, window.admin.ckeditor_cfg);
};

// Replace empty tags
CKEDITOR.on('instanceReady', function (ev) {
    var tags = ['p', 'ol', 'ul', 'li']; // etc.
    for (var key in tags) {
        ev.editor.dataProcessor.writer.setRules(tags[key],
            {
                indent : false,
                breakBeforeOpen : false,
                breakAfterOpen : false,
                breakBeforeClose : false,
                breakAfterClose : false
            });
    }
    // Replace <br> on <p>
    ev.editor.dataProcessor.writer.setRules('br',
        {
            indent: false,
            breakBeforeOpen: false,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: false
        });
});