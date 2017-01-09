
function fetchFromBackend(url, resultHandler) {
    console.log("Fetching data from:",url);
    window.fetch(url).then(function(response) {
        return response.json();
    }).then(function(json) {
        resultHandler(json);
    }).catch(function(ex) {
        console.log('Fetching data from:', url, 'failed with', ex);
    });
}

module.exports = {
    fetchSessionStatus: function(resultHandler) {
        fetchFromBackend('/rest/session', resultHandler);
    },
    fetchAllAttendees: function(resultHandler) {
        fetchFromBackend('/rest/attendees/', resultHandler);
    },
    fetchAttendees: function(groupId, resultHandler) {
        fetchFromBackend('/rest/attendees/group/' + groupId, resultHandler);
    },
    fetchGroups: function(resultHandler) {
        fetchFromBackend('/rest/groups', resultHandler);
    },
    fetchGroupAttendanceSummary: function(groupId, resultHandler) {
        fetchFromBackend('/rest/attendance/group/summary/' + groupId, resultHandler);
    },
    fetchTrainingAttendance: function(date, time, resultHandler) {
        fetchFromBackend('/rest/attendance/' + date + '/' + time, resultHandler);
    },
    fetchTrainings: function(resultHandler) {
        fetchFromBackend('/rest/trainings', resultHandler);
    },
    sendAttendance: function(attendeeId, training) {
        var form = new FormData();
        form.append("attendee_id", attendeeId);
        form.append("training_id", training.training_id);
        form.append("training_time", training.name);
        fetch('/rest/attendance', {
            method: 'POST',
            body: form,
        }).then(function(response) {
            // nothing special here
        }).catch(function(ex) {
            console.log('Sending attendance data failed with', ex);
        });
    }
};
