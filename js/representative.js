$(function() {
    var $repInfoContainer = $('.representative-info');

    function showRepInfo() {
        if (!signedInUserInfo) {
            setTimeout(showRepInfo, 500);
        }
        else {
            $.get('https://congress.api.sunlightfoundation.com/legislators/locate?zip=' + signedInUserInfo.zip + '&apikey=dd1efa0eb1134301ab43db5864ba5e78', function(result) {
                result.results.forEach(function(rep) {
                    var $div = $('<div>');
                    $div.append($('<a>', { text: 'contact', href: rep.contact_form, target: '_blank' }));
                    var $subDiv = $('<div>');
                    $subDiv.append($('<span>', { html: rep.first_name }));
                    $subDiv.append($('<span>', { html: ' ' + rep.middle_name }));
                    $subDiv.append($('<span>', { html: ' ' + rep.last_name }));
                    $subDiv.append($('<span>', { html: ' (' + rep.party + ')' }));
                    $div.append($subDiv);
                    $repInfoContainer.append($div);
                });
            });
        }
    }

    if ($repInfoContainer.length) {
        showRepInfo();
    }
});