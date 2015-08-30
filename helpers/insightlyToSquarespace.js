var fs = require('fs'),
    env = require('jsdom').env,
    jQuery = require('jquery');

function adaptForm(htmlForm) {
    return new Promise(function(resolve, reject) {
        env(htmlForm, function(err, window) {
            var $ = require('jquery')(window);

            $('br').remove();

            var $squarespaceForm = $('<div>', { 'class': 'sqs-block form-block sqs-block-form', style: 'padding: 0;' });

            var $currLevel = $squarespaceForm.append($('<div>', { 'class': 'sqs-block-content' })).find('div');
            $currLevel = $currLevel.append($('<div>', { 'class': 'form-wrapper' })).find('div');
            $currLevel = $currLevel.append($('<div>', { 'class': 'form-inner-wrapper' })).find('div');
            $currLevel = $currLevel.append($('<form>', { 'autocomplete': 'on', 'id': 'PLACEHOLDER' })).find('form');

            $currLevel.append($('input[name=formId]'));

            $currLevel = $currLevel.append($('<div>', { 'class': 'field-list clear' })).find('div');

            // console.log($('#insightly_background').prev().prop('tagName'));

            $('input[type=text]').each(function(index) {
                // console.log($(this).attr('name'));
                var $oldInput = $(this);

                var labelText = $oldInput.prev().text();
                var newId = labelText.toLowerCase()
                    .replace(/^\s+/gi, '')
                    .replace(/\s+$/gi, '')
                    .replace(/[^\w\s]/gi, '')
                    .replace(/ /g, '-');

                var $inputHolder = $('<div>', { 'class': 'form-item field' });
                $inputHolder.append($('<label>', { 'class': 'title', 'for': newId, 'text': labelText }));
                $inputHolder.append($('<input>', { 'class': 'field-element', 'id': newId, 'name': $oldInput.attr('name'), 'type': 'text', 'spellcheck': 'false' }));
                $currLevel.append($inputHolder);

            });

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