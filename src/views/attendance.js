import React, { Component } from 'react';
import { DropdownButton, MenuItem, ListGroup, ListGroupItem } from 'react-bootstrap';
import AppHeader  from '../components/header';
import { AttendeeList, GroupSelect } from '../components/attendee_list';
import Session from '../components/session';
import utils from '../utils';
import './attendance.css';

class TrainingSelect extends Component {
    constructor() {
        super();
        this.state = {
            trainings: null,
            selectedTraining: { id: null, date: "..." },
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
            this.setState({
                selectedTraining: this.getTrainingById(this.state.trainings, trainingId),
            });
            // and fire the parent handler
            this.props.changeHandler(trainingId);
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
            self.props.changeHandler(selected.id);
        }(this, data));
    }

    render() {
        let contents = "";
        if (this.state.trainings != null) {
            contents = this.state.trainings.map((t) =>
                <MenuItem key={"training" + t.id} eventKey={t.id} active={t.id === this.state.selectedTraining.id ? true : false}>{t.date}</MenuItem>
            );
        }
        return (
            <div className="trainingSelect">
                <DropdownButton bsStyle="default" title={this.state.selectedTraining.date} id="selectTraining" onSelect={(trainingId) => this.handleTrainingChange(trainingId)}>
                    {contents}
                </DropdownButton>
            </div>
        );
    }
}

class AttendanceInput extends AttendeeList {
    constructor() {
        super();
        this.state = {
            ...this.state,
            attendance: {},
        };
    }

    updateAttendance(id) {
        console.log("clicked", id);
    }

    handleGroupChange(groupId) {
        super.handleGroupChange(groupId);
        // now also fetch current attendance data for this group/training
//        utils.fetchAttendees(groupId, (data) => function(self, data){
//            self.setState({
//                attendees: data.attendees
//            });
//        }(this, data));
    }

    handleTrainingChange(trainingId) {
        console.log("Changed training to", trainingId);
    }

    render() {
        return (
            <div>
                <GroupSelect changeHandler={(groupId) => this.handleGroupChange(groupId)}/>
                <TrainingSelect changeHandler={(trainingId) => this.handleTrainingChange(trainingId)}/>
                <ListGroup>
                    {this.state.attendees.map((a) =>
                        <ListGroupItem key={a.attendee_id} onClick={() => this.updateAttendance(a.attendee_id)}>{a.name}</ListGroupItem>
                    )}
                </ListGroup>
            </div>
        );
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