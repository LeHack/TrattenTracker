import React, { Component } from 'react';
import { DropdownButton, MenuItem, ListGroup, ListGroupItem } from 'react-bootstrap';
import AppHeader  from '../components/header';
import { AttendeeList, GroupSelect } from '../components/attendee_list';
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

class AttendanceInput extends AttendeeList {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            attendance: {},
            training: null,
        };
    }

    updateAttendance(id) {
        let updated = {...this.state.attendance};
        updated[id] = !updated[id]
        this.setState({
            attendance: updated,
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
                <GroupSelect bsSize="sm" changeHandler={(groupId) => this.handleGroupChange(groupId)}/>
                <TrainingSelect changeHandler={(training) => this.handleTrainingChange(training)}/>
                <ListGroup>
                    {this.state.attendees.map((a) =>
                        <ListGroupItem key={a.attendee_id} onClick={() => this.updateAttendance(a.attendee_id)} active={this.state.attendance[a.attendee_id]}>{a.name}</ListGroupItem>
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