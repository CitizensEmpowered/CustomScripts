$(function() {
    var topicRef = new Firebase("https://ce-testing.firebaseio.com/topics");
    var topicsContainer = $('.topic-viewer');

    function handleNewTopic(snapshot) {
        var data = snapshot.val();

        console.log(data);
    }

    if (topicsContainer.length) {
        topicRef.on('value', handleNewTopic);
    }
    else {
        console.log('Not loading because no container');
    }

    console.log('here');
});