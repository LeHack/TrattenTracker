import Cookies from 'universal-cookie';
const cookies = new Cookies();

function handleComms(url, data, resultHandler, errHandler) {
    window.fetch(url, {
        ...data,
        credentials: 'same-origin',
    }).then(function(response) {
        if (response.status !== 200) {
            throw response;
        }
        return response.json();
    })
    .then(resultHandler)
    .catch(errHandler);
}

function fetchFromBackend(url, resultHandler, errHandler) {
    if (!errHandler) {
        errHandler = function(ex) { console.log('Fetching data from:', url, 'failed with', ex) };
    }
    handleComms(url, {}, resultHandler, errHandler);
}

function sendToBackend(url, data, resultHandler, errHandler) {
    if (!errHandler) {
        errHandler = function(ex) { console.log('Sending data to:', url, 'failed with', ex) };
    }
    data.append('csrfmiddlewaretoken', cookies.get('csrftoken'));

    handleComms(url, {
        method: 'POST',
        body: data,
    }, resultHandler, errHandler);
}

module.exports = {
    // Lists
    fetchAllAttendees: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/list/attendees', resultHandler, errHandler);
    },
    fetchAttendees: function(groupId, resultHandler, errHandler) {
        fetchFromBackend('/rest/list/attendees/group:' + groupId, resultHandler, errHandler);
    },
    fetchGroups: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/list/groups', resultHandler, errHandler);
    },
    fetchTrainings: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/list/trainings/latest', resultHandler, errHandler);
    },
    fetchTrainingsByMonth: function(year, month, resultHandler, errHandler) {
        fetchFromBackend('/rest/list/trainings/year:' + year + '/month:' + month, resultHandler, errHandler);
    },
    fetchTrainingAttendance: function(date, time, resultHandler, errHandler) {
        fetchFromBackend('/rest/list/attendance/date:' + date + '/time:' + time, resultHandler, errHandler);
    },
    fetchMonthlyAttendance: function(attendeeId, month, resultHandler, errHandler) {
        fetchFromBackend('/rest/list/attendance/attendee:' + attendeeId + '/month:' + month, resultHandler, errHandler);
    },
    fetchPayments: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/list/payments/attendee:' + attendeeId, resultHandler, errHandler);
    },

    // Summaries
    fetchGroupAttendanceSummary: function(groupId, resultHandler, errHandler) {
        fetchFromBackend('/rest/summarize/attendance/group:' + groupId, resultHandler, errHandler);
    },
    fetchAttendanceSummary: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/summarize/attendance/attendee:' + attendeeId + '/total', resultHandler, errHandler);
    },
    fetchAttendanceSplitSummary: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/summarize/attendance/attendee:' + attendeeId + '/monthly', resultHandler, errHandler);
    },
    fetchGroupOutstanding: function(groupId, resultHandler, errHandler) {
        fetchFromBackend('/rest/summarize/payments/group:' + groupId, resultHandler, errHandler);
    },
    fetchOutstanding: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/summarize/payments/attendee:' + attendeeId, resultHandler, errHandler);
    },
    fetchMonthlyFee: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/get/fee/attendee:' + attendeeId, resultHandler, errHandler);
    },

    sendAttendance: function(params, successHandler, errorHandler) {
        var form = new FormData();
        form.append('attendance', JSON.stringify(params['attendance']));
        form.append('training_id', params['training'].training_id);
        form.append('training_time', params['training'].name);
        sendToBackend('/rest/update/attendance', form, successHandler, errorHandler);
    },
    sendPayment: function(params, successHandler, errorHandler) {
        var form = new FormData();
        form.append('payment', JSON.stringify(params));
        sendToBackend('/rest/update/payments', form, successHandler, errorHandler);
    },

    // Session handling
    fetchSessionStatus: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/get/session', resultHandler, errHandler);
    },
    login: function(login, pass, successHandler, errorHandler) {
        var form = new FormData();
        form.append('login', login);
        form.append('password', pass);
        sendToBackend('/rest/login', form, successHandler, errorHandler);
    },
    logout: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/logout', resultHandler, errHandler);
    }
};
