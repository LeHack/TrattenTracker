import React, { Component } from 'react';
import { Collapse, DropdownButton, MenuItem, ListGroup, ListGroupItem } from 'react-bootstrap';
import AppHeader  from '../components/header';
import Session from '../components/session';
import utils from '../utils';
import './attendance.css';


class TrainingSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            trainings: null,
            selectedTraining: { id: null, name: "..." },
        };
    }

    getTrainingById(trainings, trainingId) {
        let selected = null;
        for (let t of trainings) {
            if (t.id === trainingId) {
                selected = t;
                break;
            }
        }
        return selected;
    }

    handleTrainingChange(trainingId) {
        if (trainingId !== this.state.selectedTraining.id) {
            // update our own state
            let selected = this.getTrainingById(this.state.trainings, trainingId);
            this.setState({
                selectedTraining: selected,
            });
            // and fire the parent handler
            this.props.changeHandler(selected);
        }
    }

    componentDidMount() {
        utils.fetchTrainings((data) => function(self, data){
            let selected = self.getTrainingById(data.trainings, data.selected);
            self.setState({
                trainings: data.trainings,
                selectedTraining: selected,
            });
            // we must call this once on init
            self.props.changeHandler(selected);
        }(this, data));
    }

    render() {
        let contents = "";
        if (this.state.trainings != null) {
            contents = this.state.trainings.map((t) =>
                <MenuItem key={"training" + t.id} eventKey={t.id} active={t.id === this.state.selectedTraining.id ? true : false}>{t.name}</MenuItem>
            );
        }
        return (
            <div className="trainingSelect">
                <DropdownButton bsStyle="default" bsSize="sm" pullRight={true} title={this.state.selectedTraining.name} id="selectTraining" onSelect={(trainingId) => this.handleTrainingChange(trainingId)}>
                    {contents}
                </DropdownButton>
            </div>
        );
    }
}

class AttendanceInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            attendees: [],
            attendeeGroup: {},
            attendance: {},
            training: null,
        };
        this.groupLoading = [];
    }

    updateAttendance(id) {
        let updated = {...this.state.attendance};
        updated[id] = !updated[id]
        this.setState({
            attendance: updated,
        });
        // now send the data to backend
        // ...
    }

    componentDidMount() {
        utils.fetchGroups((data) => function(self, data){
            for (let group of data.groups) {
                self.groupLoading.push({ id: group.group_id, done: false });
                self.processGroup(group);
            }
        }(this, data));
    }

    processGroup(group) {
        // join together data for all groups
        utils.fetchAttendees(group.group_id, (data) => function(self, data){
            let groupState = {};
            let groupId = "GRP:" + group.group_id;
            groupState[groupId] = false;
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
        }(this, data));
    }

    finishProcessing() {
        let attendees = []
        let groupState = {}
        for (let group of this.groupLoading) {
            if (!group.done) {
                return;
            }
            attendees.push.apply(attendees, group.attendees);
            Object.assign(groupState, group.groupState);
        }

        // if every group has been processed, join and update state
        this.setState({
            attendees: attendees,
            groupState: groupState,
        });
    }

    handleTrainingChange(training) {
        if (training != null) {
            utils.fetchTrainingAttendance(training.date, training.time, (data) => function(self, data){
                let attendance = {};
                for (let att of data.attendance) {
                    attendance[att.attendee_id] = true;
                }
                self.setState({
                    attendance: attendance,
                    training: training,
                });
            }(this, data));
        }
    }

    render() {
        return (
            <div>
                <div className="controlBar">
                    <TrainingSelect changeHandler={(training) => this.handleTrainingChange(training)}/>
                </div>
                {this.state.attendees.map((g) =>
                    <div className="lists" key={g.label.id}>
                        <ListGroup>
                            <ListGroupItem bsStyle="info" header={g.label.name} onClick={() => this.toggleGroup(g.label.id)}/>
                        </ListGroup>
                        <Collapse in={this.state.attendeeGroup[g.label.id]}>
                            <ListGroup>
                                {g.entries.map((a) =>
                                    <ListGroupItem key={a.attendee_id} onClick={() => this.updateAttendance(a.attendee_id)} active={this.state.attendance[a.attendee_id]}>
                                        {a.name}
                                    </ListGroupItem>
                                )}
                            </ListGroup>
                        </Collapse>
                    </div>
                )}
            </div>
        );
    }

    toggleGroup(id) {
        let groupState = {...this.state.attendeeGroup};
        groupState[id] = !groupState[id];
        this.setState({
            attendeeGroup: groupState,
        });
    }
}

class Attendance extends Session {
    render() {
        let title = (<p>Wprowadzanie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.state.session} location="Obecności" />
                <AttendanceInput />
            </div>
        );
    }
}

export default Attendance;