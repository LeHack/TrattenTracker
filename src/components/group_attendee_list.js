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
        utils.fetchGroups((data) => function(self, data){
            for (let group of data.groups) {
                self.groupLoading.push({ id: group.group_id, done: false });
                self.processGroup(group);
            }
        }(this, data), this.props.fatalError);
    }

    processGroup(group) {
        // join together data for all groups
        utils.fetchAttendees(group.group_id, (data) => function(self, data){
            let groupState = {};
            let groupId = "GRP:" + group.group_id;
            groupState[groupId] = true;
            let attendeGroup = {
                label: {
                    id: groupId,
                    name: group.name,
                },
                entries: data.attendees,
            };
            for (let g of self.groupLoading) {
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
        for (let group of this.groupLoading) {
            if (!group.done) {
                return;
            }
            attendees.push.apply(attendees, group.attendees);
            Object.assign(groupState, group.attendeeGroup);
        }
        // if every group has been processed, join and update state
        this.setState({
            attendees: attendees,
            attendeeGroup: groupState,
        });
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
    render() {
        return (
            <div>
                {this.props.children}
                {this.props.attendees.length > 0 ?
                    <div>
                    {this.props.attendees.map((g) =>
                        <PanelGroup key={g.label.id}>
                            <Panel collapsible expanded={this.props.attendeeGroup[g.label.id]} header={g.label.name} onClick={() => this.props.toggleGroup(g.label.id)}>
                                <ListGroup>
                                    {g.entries.map((a) => this.props.renderRow(a) )}
                                </ListGroup>
                            </Panel>
                        </PanelGroup>
                    )}
                    </div>
                    : <ProgressBar active label="Ładowanie..." now={100} />
                }
            </div>
        );
    }
}

export default GroupHandler(ListView);
