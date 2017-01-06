import React, { Component } from 'react';
import AppHeader  from './header';
import utils from '../utils';

function AttendeeList(props) {
    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Imię i nazwisko</th>
                    <th>Grupa</th>
                    <th>Karta sportowa</th>
                </tr>
            </thead>
            <tbody>
                {props.data.map((a) =>
                    <tr key={a.attendee_id}>
                        <td>{a.attendee_id}</td>
                        <td>{a.name}</td>
                        <td>{a.group_id}</td>
                        <td>{a.sport_card ? 'tak' : 'nie'}</td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}

class AttendanceSummary extends Component {
    constructor() {
        super();
        this.state = {
            attendees: []
        };
    }

    componentDidMount() {
        utils.fetchAttendees((data) => function(self, data){
            self.setState({
                attendees: data.attendees
            });
        }(this, data));
    }

    render() {
        return (
            <div>
                <AppHeader/>
                <div className="page-header"><h1>Lista uczestników</h1></div>
                <AttendeeList data={this.state.attendees} />
            </div>
        );
    }
}

export default AttendanceSummary;