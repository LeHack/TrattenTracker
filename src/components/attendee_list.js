import React, { Component } from 'react';
import utils from '../utils';

import { DropdownButton, MenuItem, Table } from 'react-bootstrap';


export class GroupSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            selectedGroupId: null
        };
    }

    getAttendeeById(data, id) {
        let selected = null;
        for (let d of data) {
            if (d.attendee_id === id) {
                selected = d;
                break;
            }
        }
        return selected;
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
        }(this, data), this.props.fatalError);
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
            <div>
                <DropdownButton bsStyle="default" title={selectedName} id="selectGroup"
                        onSelect={(groupId) => this.handleGroupChange(groupId)}
                        bsSize={this.props.bsSize ? this.props.bsSize : null}
                    >
                    {this.state.groups.map((g) =>
                        <MenuItem key={"group" + g.group_id} eventKey={g.group_id} active={g.group_id === this.state.selectedGroupId ? true : false}>{g.name}</MenuItem>
                    )}
                </DropdownButton>
            </div>
        );
    }
}

export class AttendeeList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            attendees: [],
        };
    }

    handleGroupChange(groupId) {
        utils.fetchAttendees(groupId, (data) => function(self, data){
            self.setState({
                attendees: data.attendees
            });
        }(this, data), this.fatalErrorHandler);
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

    fatalErrorHandler(error) {
        console.log("Debug", error);
        this.setState({errorStatus: true});
    }

    render() {
        return (
            <div>
                <GroupSelect changeHandler={(groupId) => this.handleGroupChange(groupId)} fatalError={(error) => this.fatalErrorHandler(error)}/>
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