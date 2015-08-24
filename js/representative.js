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
                    $div.append($('<span>', { html: rep.first_name }));
                    $div.append($('<span>', { html: rep.middle_name }));
                    $div.append($('<span>', { html: rep.last_name }));
                    $div.append($('<span>', { html: '(' + rep.party + ')' }));
                    $div.append($('<a>', { text: 'contact', href: rep.contact_form }));
                    $repInfoContainer.append($div);
                });
            });
        }
    }

    if ($repInfoContainer.length) {
        showRepInfo();
    }
});