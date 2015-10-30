$(function() {
    var topicRef = new Firebase('https://citizensempowered.firebaseio.com/topics');
    var $topicsContainer = $('.topic-viewer');

    function handleNewTopic(snapshot) {
        var data = snapshot.val();

        console.log('Got topic:', data);

        for (var key in data) {
            var topic = data[key];

            $topicsContainer.append($('<div>', { html: JSON.stringify(topic, 2) }));
        }
    }

    function handleNewTopicError(errorObject) {
        console.log('The read failed: ' + errorObject.code);
    }

    if ($topicsContainer.length) {
        topicRef.once('value', handleNewTopic, handleNewTopicError);
    }
});