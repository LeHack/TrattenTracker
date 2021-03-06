import React, { Component } from 'react';
import { ProgressBar, ListGroup, Panel, PanelGroup } from 'react-bootstrap';
import update from 'immutability-helper';

import utils from '../utils';

let GroupHandler = ComposedComponent => class extends Component {
    constructor(props) {
        super(props);

        this.toggleGroup = this.toggleGroup.bind(this);
        this.state = {
            attendees: [],
            attendeeGroup: {},
        };
        this.groupLoading = [];
    }

    fetchGroupData() {
        let attendeeData = JSON.parse(localStorage.getItem('attendeeData'));
        if (!attendeeData || attendeeData.timestamp + 60000 < new Date().getTime()) {
            utils.fetchGroups((data) => function(self, data){
                for (let i = 0; i < data.groups.length; i++){
                    let group = data.groups[i];
                    self.groupLoading.push({ id: group.group_id, done: false });
                    self.processGroup(group);
                }
            }(this, data), this.props.fatalError);
        }
        else {
            this.setState(attendeeData);
            // if we have any postprocessing to do, run it now
            if (this.props.runWithAttendees) {
                this.props.runWithAttendees(attendeeData.attendees);
            }
        }
    }

    processGroup(group) {
        // join together data for all groups
        utils.fetchAttendees(group.group_id, (data) => function(self, data){
            let groupState = {};
            let labelId = "GRP:" + group.group_id;
            groupState[labelId] = true;
            let attendeGroup = {
                groupId: group.group_id,
                label: {
                    id: labelId,
                    name: group.name,
                },
                entries: data.attendees,
            };
            for (let i = 0; i < self.groupLoading.length; i++){
                let g = self.groupLoading[i];
                if (g.id === group.group_id) {
                    g["attendees"] = [attendeGroup];
                    g["attendeeGroup"] = groupState;
                    g["done"] = true;
                    break;
                }
            }
            self.finishProcessing();
        }(this, data), this.props.fatalError);
    }

    finishProcessing() {
        let attendees = [];
        let groupState = {};
        for (let i = 0; i < this.groupLoading.length; i++){
            let group = this.groupLoading[i];
            if (!group.done) {
                return;
            }
            attendees.push.apply(attendees, group.attendees);
            Object.assign(groupState, group.attendeeGroup);
        }

        // if every group has been processed, join and update state
        let attendeeData = {
            attendees: attendees,
            attendeeGroup: groupState,
        };
        this.setState(attendeeData);
        attendeeData.timestamp = new Date().getTime();
        localStorage.setItem('attendeeData', JSON.stringify(attendeeData));

        // if we have any postprocessing to do, run it now
        if (this.props.runWithAttendees) {
            this.props.runWithAttendees(attendees);
        }
    }

    componentDidMount() {
        this.fetchGroupData();
    }

    toggleGroup(id) {
        this.setState({
            attendeeGroup: update(this.state.attendeeGroup, {
                [id]: {$set: !this.state.attendeeGroup[id]}
            }),
        });
    }

    render() {
        return <ComposedComponent {...this.props} {...this.state} toggleGroup={this.toggleGroup} />;
    }
};

class ListView extends Component {
    shouldShowProgressBar() {
        let should = false;

        if (this.props.shouldShowProgressBar) {
            should = this.props.shouldShowProgressBar();
        }
        else {
            should = (this.props.attendees.length === 0);
        }

        return should;
    }

    renderBody(entries) {
        return (
            <ListGroup>
                {entries.map((a) => this.props.renderRow(a) )}
            </ListGroup>
        );
    }

    render() {
        let renderBody = this.props.renderBody;
        if (!renderBody) {
            // if not defined, use our ListGroup-based implementation
            renderBody = this.renderBody.bind(this);
        }
        return (
            <div>
                {this.props.children}
                {this.shouldShowProgressBar() ?
                    <ProgressBar active label="Ładowanie listy ćwiczących..." now={100} />
                    :
                    <div>
                    {this.props.attendees.map((g) =>
                        <PanelGroup key={g.label.id}>
                            <Panel collapsible expanded={this.props.attendeeGroup[g.label.id]} header={g.label.name} onClick={() => this.props.toggleGroup(g.label.id)}>
                                {renderBody(g.entries)}
                            </Panel>
                        </PanelGroup>
                    )}
                    </div>
                }
            </div>
        );
    }
}

export default GroupHandler(ListView);
