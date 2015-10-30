var fs = require('fs'),
    env = require('jsdom').env,
    jQuery = require('jquery');

function adaptForm(htmlForm) {
    return new Promise(function(resolve, reject) {
        env(htmlForm, function(err, window) {
            var $ = jQuery(window);

            $('br').remove();

            var $squarespaceForm = $('<div>', { 'class': 'sqs-block form-block sqs-block-form', style: 'padding: 0;' });

            var $currLevel = $squarespaceForm.append($('<div>', { 'class': 'sqs-block-content' })).children('div');
            $currLevel = $currLevel.append($('<div>', { 'class': 'form-wrapper' })).children('div');
            $currLevel = $currLevel.append($('<div>', { 'class': 'form-inner-wrapper' })).children('div');
            $currLevel = $currLevel.append($('<form>', { 'autocomplete': 'on', 'id': 'give-info' })).children('form');

            $currLevel.append($('input[type=hidden]'));

            $currLevel = $currLevel.append($('<div>', { 'class': 'field-list clear' })).children('div');

            // console.log($('#insightly_background').prev().prop('tagName'));

            $('input[type=text], textarea').each(function(index) {
                // console.log($(this).attr('name'));
                var $oldInput = $(this);

                var labelText = $oldInput.prev().text();
                var newId = 'give-info__' + labelText.toLowerCase()
                    .replace(/^\s+/gi, '')
                    .replace(/\s+$/gi, '')
                    .replace(/[^\w\s]/gi, '')
                    .replace(/ /g, '-');

                var oldInputType = $oldInput.prop('tagName');

                var $inputHolder = $('<div>', { 'class': 'form-item field ' + (oldInputType === 'INPUT' ? 'text' : 'textarea') });
                $inputHolder.append($('<label>', { 'class': 'title', 'for': newId, 'text': labelText }));
                $inputHolder.append($('<' + oldInputType + '>', { 'class': 'field-element', 'id': newId, 'name': $oldInput.attr('name'), 'type': 'text', 'spellcheck': 'false' }));
                $currLevel.append($inputHolder);
            });

            $currLevel = $currLevel.parent();
            $currLevel = $currLevel.append($('<div>', { 'class': 'form-button-wrapper form-button-wrapper--align-left' })).children('div:nth-of-type(2)');

            $currLevel.append($('<input>', { 'class': 'button sqs-system-button sqs-editable-button', 'type': 'submit', 'value': 'Update Account Information' }));

            resolve($squarespaceForm.prop('outerHTML'));
        });
    });
}

function convert() {
    return new Promise(function(resolve, reject) {
            fs.readFile('insightlyForm.html', 'utf8', function(err, data) {
                if (err) reject(err);
                else resolve(data);
            });
        })
        .then(adaptForm)
        .then(function(newHtmlForm) {
            return new Promise(function(resolve, reject) {
                fs.writeFile('squarespaceForm.html', newHtmlForm, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        })
        .catch(function(err) { console.log(err); });
}

convert();