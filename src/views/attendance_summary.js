import React from 'react';
import AppHeader from '../components/header';
import AttendeeList from '../components/attendee_list';
import Session from '../components/session';
import utils from '../utils';
import './attendance_summary.css';

class AttendeeSummaryList extends AttendeeList {
    constructor() {
        super();
        this.state = {
            ...this.state,
            stats: {},
        };
    }

    handleGroupChange(groupId, event) {
        super.handleGroupChange(groupId, event);
        utils.fetchGroupAttendanceSummary(groupId, (data) => function(self, data){
            self.setState({
                stats: data.stats
            });
        }(this, data));
    }

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


class AttendanceSummary extends Session {
    render() {
        let title = (<p>Zestawienie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.state.session} location="Zestawienie obecności" />
                <AttendeeSummaryList />
            </div>
        );
    }
}

export default AttendanceSummary;