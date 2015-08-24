$(function() {
    var $repInfoContainer = $('.representative-info');

    if ($repInfoContainer.length) {
        $.get('https://congress.api.sunlightfoundation.com/legislators/locate?zip=' + signInUserInfo.zip + '&apikey=dd1efa0eb1134301ab43db5864ba5e78', function(result) {
            console.log(result);
        });
    }
});