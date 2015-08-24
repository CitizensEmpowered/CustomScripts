$(function() {
    var topicRef = new Firebase('https://ce-testing.firebaseio.com/topics');
    var $topicsContainer = $('.topic-viewer');

    function handleNewTopic(snapshot) {
        var data = snapshot.val();

        console.log(data);

        for (var key in data) {
            var topic = data[key];

            $topicsContainer.append($('<div>', { html: JSON.stringify(topic) }));
        }
    }

    function handleNewTopicError(errorObject) {
        console.log('The read failed: ' + errorObject.code);
    }

    if ($topicsContainer.length) {
        console.log('Loading because container');
        topicRef.once('value', handleNewTopic, handleNewTopicError);
    }
    else {
        console.log('Not loading because no container');
    }

    console.log('here');
});