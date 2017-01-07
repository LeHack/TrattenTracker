import React, { Component } from 'react';
import AppHeader  from '../components/header';
import AttendeeList from '../components/attendee_list';
import utils from '../utils';
import './attendance_summary.css';

class AttendeeSummaryList extends AttendeeList {
    renderHeaders() {
        return (
            <thead>
                <tr>
                    <th>Imię i nazwisko</th>
                    <th>Statystyki</th>
                </tr>
            </thead>
        );
    }

    renderBody(rowData){
        // shortcuts
        let s = this.state.stats;
        let a = rowData;
        return (
            <tr key={a.attendee_id}>
                <td>{a.name}</td>
                <td className="statistics">
                    {s[a.attendee_id] &&
                        <div>
                            <span>Podstawowe: {s[a.attendee_id].basic.count} ({s[a.attendee_id].basic.freq}%)</span>
                            <span>Dodatkowe: {s[a.attendee_id].extra.count} ({s[a.attendee_id].extra.freq}%)</span>
                        </div>
                    }
                </td>
            </tr>
        );
    }
}


class AttendanceSummary extends Component {
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
                <AttendeeSummaryList />
            </div>
        );
    }
}

export default AttendanceSummary;