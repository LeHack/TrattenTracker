import React, { Component } from 'react';
import AppHeader  from '../components/header';
import AttendeeList from '../components/attendee_list';
import Session from '../components/session';


class Attendance extends Session {
    render() {
        let title = (<p>Wprowadzanie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.state.session} location="Obecności" />
                <AttendeeList />
            </div>
        );
    }
}

export default Attendance;