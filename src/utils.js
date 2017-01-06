
function fetchFromBackend(url, resultHandler) {
    console.log("Fetching data from:",url)
    window.fetch(url)
    .then(function(response) {
        return response.json()
    }).then(function(json) {
        resultHandler(json);
    }).catch(function(ex) {
        console.log('Fetching data from', url, 'failed with', ex)
    });
}

module.exports = {
    fetchSessionStatus: function(resultHandler) {
        fetchFromBackend('/rest/session', resultHandler)
    },
    fetchAttendees: function(resultHandler) {
        fetchFromBackend('/rest/attendees', resultHandler)
    }
};
