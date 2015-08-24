$(function() {
    var $repInfoContainer = $('.representative-info');

    function showRepInfo() {
        if (!signedInUserInfo) {
            setTimeout(showRepInfo, 500);
        }
        else {
            $.get('https://congress.api.sunlightfoundation.com/legislators/locate?zip=' + signedInUserInfo.zip + '&apikey=dd1efa0eb1134301ab43db5864ba5e78', function(result) {
                console.log(result);
            });
        }
    }

    if ($repInfoContainer.length) {
        showRepInfo();
    }
});