import React, { Component } from 'react';
import utils from '../utils';

import { DropdownButton, MenuItem, Table } from 'react-bootstrap';


export class GroupSelect extends Component {
    constructor() {
        super();
        this.state = {
            groups: [],
            selectedGroupId: null,
        };
    }

    handleGroupChange(groupId) {
        if (groupId !== this.state.selectedGroupId) {
            // update our own state
            this.setState({
                selectedGroupId: groupId,
            });
            // and fire the parent handler
            this.props.changeHandler(groupId);
        }
    }

    componentDidMount() {
        utils.fetchGroups((data) => function(self, data){
            self.setState({
                groups: data.groups,
                selectedGroupId: data.selected,
            });
            // we must call this once on init
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
            <DropdownButton bsStyle="default" title={selectedName} id="selectGroup" onSelect={(groupId) => this.handleGroupChange(groupId)}>
                {this.state.groups.map((g) =>
                    <MenuItem key={"group" + g.group_id} eventKey={g.group_id} active={g.group_id === this.state.selectedGroupId ? true : false}>{g.name}</MenuItem>
                )}
            </DropdownButton>
        );
    }
}

export class AttendeeList extends Component {
    constructor() {
        super();
        this.state = {
            attendees: [],
        };
    }

    handleGroupChange(groupId, event) {
        utils.fetchAttendees(groupId, (data) => function(self, data){
            self.setState({
                attendees: data.attendees
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