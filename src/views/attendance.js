import React, { Component } from 'react';
import AppHeader  from '../components/header';
import AttendeeList from '../components/attendee_list';
import utils from '../utils';


class Attendance extends Component {
    constructor() {
        super();
        this.state = {
            session: { "user": null },
        };
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => function(self, session){
            self.setState({
                session: session
            });
        }(this, session));
    }

    render() {
        return (
            <div>
                <AppHeader user={this.state.session.user} />
                <AttendeeList />
            </div>
        );
    }
}

export default Attendance;