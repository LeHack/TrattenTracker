import React, { Component } from 'react';
import AppHeader  from './header';
import utils from '../utils';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import './attendance_summary.css';

function GroupSelect(props) {
    let selectedName = '...';
    for (let g of props.groups) {
        if (g.group_id === props.selectedId) {
            selectedName = g.name;
            break;
        }
    }

    return (
        <div className="page-header">
            <h1>Lista uczestników</h1>

            <DropdownButton bsStyle="default" title={selectedName} id="selectGroup" onSelect={props.handler}>
                {props.groups.map((g) =>
                    <MenuItem key={g.group_id} eventKey={g.group_id}>{g.name}</MenuItem>
                )}
            </DropdownButton>
        </div>
    );
}

class AttendeeList extends Component {
    constructor() {
        super();
        this.state = {
            stats: {},
            group: null,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.group && this.state.group !== nextProps.group) {
            utils.fetchGroupAttendanceSummary(nextProps.group.group_id, (data) => function(self, data){
                self.setState({
                    group: nextProps.group,
                    stats: data.stats
                });
            }(this, data));
        }
    }

    render() {
        // shortcut
        let s = this.state.stats;
        return (
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Imię i nazwisko</th>
                        <th>Grupa</th>
                        <th>Karta sportowa</th>
                        <th>Statystyki</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.attendees.map((a) =>
                        <tr key={a.attendee_id}>
                            <td>{a.attendee_id}</td>
                            <td>{a.name}</td>
                            <td>{this.props.group.name}</td>
                            <td>{a.sport_card ? 'tak' : 'nie'}</td>
                            <td className="statistics">
                                {s[a.attendee_id] &&
                                    <div>
                                        <span>Podstawowe: {s[a.attendee_id].basic.count} ({s[a.attendee_id].basic.freq}%)</span>
                                        <span>Dodatkowe: {s[a.attendee_id].extra.count} ({s[a.attendee_id].extra.freq}%)</span>
                                    </div>
                                }
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }
}



class AttendanceSummary extends Component {
    constructor() {
        super();
        this.state = {
            attendees: [],
            groups: [],
            selectedGroupId: null,
            session: { "user": null },
        };
    }

    handleGroupChange(groupId, event) {
        utils.fetchAttendees(groupId, (data) => function(self, data){
            self.setState({
                selectedGroupId: groupId,
                attendees: data.attendees
            });
        }(this, data));
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => function(self, session){
            self.setState({
                session: session
            });
        }(this, session));

        utils.fetchGroups((data) => function(self, data){
            self.setState({
                groups: data.groups,
                selectedGroupId: data.selected,
            });

            // only fetch attendees after fetching the selected group
            self.handleGroupChange(data.selected);
        }(this, data));
    }

    render() {
        let selected=null
        for (let group of this.state.groups) {
            if (group.group_id === this.state.selectedGroupId) {
                selected = group;
                break;
            }
        }
        return (
            <div>
                <AppHeader user={this.state.session.user} />
                <GroupSelect groups={this.state.groups} selectedId={this.state.selectedGroupId} handler={(groupId, event) => this.handleGroupChange(groupId, event)}/>
                <AttendeeList attendees={this.state.attendees} group={selected} />
            </div>
        );
    }
}

export default AttendanceSummary;