import React from 'react';
import { Jumbotron } from 'react-bootstrap';
import './error.css';

function fetchFromBackend(url, resultHandler, errHandler) {
    console.log("Fetching data from:",url);
    if (!errHandler) {
        // provide a default error handler
        errHandler = function(ex) {
            console.log('Fetching data from:', url, 'failed with', ex);
        };
    }
    window.fetch(url).then(function(response) {
        if (response.status !== 200) {
            // trigger error handler
            throw response;
        }
        return response.json();
    })
    .then(resultHandler)
    .catch(errHandler);
}

module.exports = {
    fetchSessionStatus: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/session', resultHandler, errHandler);
    },
    fetchAllAttendees: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/attendees/', resultHandler, errHandler);
    },
    fetchAttendees: function(groupId, resultHandler, errHandler) {
        fetchFromBackend('/rest/attendees/group/' + groupId, resultHandler, errHandler);
    },
    fetchGroups: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/groups', resultHandler, errHandler);
    },
    fetchGroupAttendanceSummary: function(groupId, resultHandler, errHandler) {
        fetchFromBackend('/rest/attendance/group/summary/' + groupId, resultHandler, errHandler);
    },
    fetchAttendanceSplitSummary: function(attendeeId, resultHandler, errHandler) {
        fetchFromBackend('/rest/attendance/attendee/split-summary/' + attendeeId, resultHandler, errHandler);
    },
    fetchTrainingAttendance: function(date, time, resultHandler, errHandler) {
        fetchFromBackend('/rest/attendance/' + date + '/' + time, resultHandler, errHandler);
    },
    fetchTrainings: function(resultHandler, errHandler) {
        fetchFromBackend('/rest/trainings', resultHandler, errHandler);
    },
    sendAttendance: function(params, errorHandler, successHandler) {
        var form = new FormData();
        form.append('attendance', JSON.stringify(params['attendance']));
        form.append('training_id', params['training'].training_id);
        form.append('training_time', params['training'].name);
        window.fetch('/rest/attendance', {
            method: 'POST',
            body: form,
        }).then(function(result){
            if (result.status !== 200) {
                errorHandler(result);
            }
            else if (successHandler) {
                successHandler(result);
            }
        }).catch(function(ex) {
            console.log('Sending data failed with', ex);
        });
    },
    Error(props) {
        return (
            <Jumbotron bsClass="jumbotron error">
                <h3>Wystąpił błąd: {props.reason}</h3>
            </Jumbotron>
        );
    }
};
