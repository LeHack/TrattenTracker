import React, { Component } from 'react';
import utils from '../utils';

import { DropdownButton, MenuItem, Table } from 'react-bootstrap';


class GroupSelect extends Component {
    constructor() {
        super();
        this.state = {
            groups: [],
            selectedGroupId: null,
        };
    }

    componentDidMount() {
        utils.fetchGroups((data) => function(self, data){
            self.setState({
                groups: data.groups,
                selectedGroupId: data.selected,
            });

            // only fetch attendees after fetching the selected group
            self.props.changeHandler(data.selected);
        }(this, data));
    }

    render() {
        let selectedName = '...';
        for (let g of this.state.groups) {
            if (g.group_id === this.state.selectedGroupId) {
                selectedName = g.name;
                break;
            }
        }

        return (
            <div className="page-header">
                <DropdownButton bsStyle="default" title={selectedName} id="selectGroup" onSelect={this.props.changeHandler}>
                    {this.state.groups.map((g) =>
                        <MenuItem key={g.group_id} eventKey={g.group_id}>{g.name}</MenuItem>
                    )}
                </DropdownButton>
            </div>
        );
    }
}

class AttendeeList extends Component {
    constructor() {
        super();
        this.state = {
            stats: {},
            attendees: [],
        };
    }

    handleGroupChange(groupId, event) {
        utils.fetchAttendees(groupId, (data) => function(self, data){
            self.setState({
                attendees: data.attendees
            });
        }(this, data));
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
                    <th>Id</th>
                    <th>Imię i nazwisko</th>
                    <th>Karta sportowa</th>
                </tr>
            </thead>
        );
    }

    renderBody(rowData){
        // shortcuts
        let a = rowData;
        return (
            <tr key={a.attendee_id}>
                <td>{a.attendee_id}</td>
                <td>{a.name}</td>
                <td>{a.sport_card ? 'tak' : 'nie'}</td>
            </tr>
        );
    }
    
    render() {
        return (
            <div>
                <GroupSelect changeHandler={(groupId, event) => this.handleGroupChange(groupId, event)}/>
                <Table responsive striped>
                    {this.renderHeaders()}
                    <tbody>
                        {this.state.attendees.map((a) => this.renderBody(a))}
                    </tbody>
                </Table>
            </div>
        );
    }
}

export default AttendeeList;