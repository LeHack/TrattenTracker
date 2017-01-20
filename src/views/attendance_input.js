import React, { Component } from 'react';
import { Button, ButtonGroup, DropdownButton, MenuItem, ListGroup, ListGroupItem, PanelGroup, Panel, ProgressBar } from 'react-bootstrap';
import AppHeader  from '../components/header';
import Session from '../components/session';
import utils from '../utils';
import '../css/attendance_input.css';

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
            // first fire the parent handler
            if (this.props.changeHandler(selected)) {
                // if everything went ok, update state
                this.setState({
                    selectedTraining: selected,
                });
            }
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
        }(this, data), this.props.fatalError);
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

function SaveChanges(props) {
    let clickHandler = props.saveHandler;
    let text = "Gotowe";
    if (props.sending) {
        text = "Wysyłanie...";
    }
    if (props.disabled) {
        clickHandler = function() { this.blur(); };
    }
    else if (!props.sending) {
        text = "Wyślij zmiany";
    }
    return (
        <ButtonGroup bsClass="btn-group saveControls">
            <Button bsSize="sm" disabled={props.disabled} onClick={clickHandler}>{text}</Button>
        </ButtonGroup>
    );
}

class AttendanceInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            attendees: [],
            attendeeGroup: {},
            attendance: {},
            sportCards: {},
            training: null,
            commsError: false,
            sending: false,
        };
        this.groupLoading = [];
    }

    componentDidMount() {
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
        let sportCards = {};
        for (let group of this.groupLoading) {
            if (!group.done) {
                return;
            }
            attendees.push.apply(attendees, group.attendees);
            Object.assign(groupState, group.attendeeGroup);
        }
        for (let g of attendees) {
            for (let a of g.entries) {
                if (!(a.attenee_id in sportCards)) {
                    sportCards[a.attendee_id] = {}
                }
                sportCards[a.attendee_id]['owns'] = a.sport_card;
            }
        }

        // if every group has been processed, join and update state
        this.setState({
            attendees: attendees,
            attendeeGroup: groupState,
            sportCards: sportCards
        });
        // possible optimization, merge this to do only one setState call
        if (this.pending_training_data) {
            this.processTrainingData();
        }
    }

    handleTrainingChange(training) {
        let change = !this.state.commsError || confirm("Nie wszystkie dane zostały zapisane. Zmiana wyboru treningu spowodujeich utratę. Czy jesteś pewien?");
        if (change) {
            utils.fetchTrainingAttendance(training.date, training.time, (data) => function(self, data){
                if (self.state.attendees.length === 0) {
                    self.pending_training_data = {
                        training: training,
                        data: data,
                    };
                }
                else {
                    self.processTrainingData(training, data);
                }
            }(this, data), this.props.fatalError);
        }
        return change;
    }

    processTrainingData(training, data) {
        if (!training) {
            training = this.pending_training_data["training"];
        }
        if (!data) {
            data = this.pending_training_data["data"];
        }
        let attendance   = {};
        let sportCards = {...this.state.sportCards};
        for (let att of data.attendance) {
            attendance[att.attendee_id] = true;
            sportCards[att.attendee_id]['used'] = att.sport_card;
        }
        this.setState({
            attendance: attendance,
            training: training,
            sportCards: sportCards,
        });
    }

    updateAttendance(attendeeId, e) {
        // make sure this click doesn't reach the panel container
        e.stopPropagation();
        // first make a copy of the state vars
        let attendance = {...this.state.attendance};
        let sportCard  = {...this.state.sportCards};

        // now check what to do
        let isPresent         = attendance[attendeeId];
        let ownsSportCard     = sportCard[attendeeId]['owns'];
        let usedSportCard     = sportCard[attendeeId]['used'];
        if (!isPresent) {
            isPresent = true;
            if (ownsSportCard) {
                usedSportCard = true;
            }
        }
        else if (isPresent && ownsSportCard && usedSportCard) {
            usedSportCard = false;
        }
        else {
            isPresent = false;
        }
        // update state
        attendance[attendeeId] = isPresent;
        sportCard[attendeeId]['used'] = usedSportCard;
        let send = !this.state.commsError;
        this.setState({
            attendance: attendance,
            sportCards: sportCard,
            sending: send,
        });
        // now send the data to backend
        if (send) {
            utils.sendAttendance({
                training: this.state.training,
                attendance: [{
                    attendee_id: attendeeId,
                    is_present: isPresent,
                    has_sport_card: (ownsSportCard && usedSportCard)
                }],
            },
            (ex) => function(ex, self) {
                console.log('Sending attendance data failed with', ex);
                self.setState({sending: false, commsError: true});
            }(ex, this),
            () => function(self){
                self.setState({sending: false});
            }(this));
        }

        return false;
    }

    saveAll() {
        // prepare data to send
        let attendance = [];
        for (let group of this.state.attendees) {
            for (let a of group.entries) {
                let sportCard = (this.state.sportCards[a.attendee_id] || false);
                let isPresent = (this.state.attendance[a.attendee_id] || false);
                attendance.push({
                    attendee_id: a.attendee_id,
                    is_present: isPresent,
                    has_sport_card: (sportCard && sportCard['owns'] && sportCard['used'])
                });
            }
        }
        // send it
        this.setState({sending: true});
        utils.sendAttendance({
            training: this.state.training,
            attendance: attendance,
        },
        (ex) => function(ex, self) {
            console.log('Sending attendance data failed with', ex);
            self.setState({commsError: true, sending: false});
            alert("Serwer nie odpowiada. Prosimy spróbować później.");
        }(ex, this),
        (result) => function(self, result) {
            // on success, reset the commsError
            self.setState({commsError: false, sending: false});
        }(this, result));
    }

    getBsStyle(attendeeId) {
        let isPresent     = this.state.attendance[attendeeId];
        let ownsSportCard = this.state.sportCards[attendeeId]['owns'];
        let usedSportCard = this.state.sportCards[attendeeId]['used'];

        let style = null;
        if (isPresent && ownsSportCard && !usedSportCard) {
            style = "danger";
        }
        else if (isPresent) {
            style = "info";
        }

        return style;
    }

    render() {
        return (
            <div>
                <div className="controlBar">
                    <SaveChanges disabled={!this.state.commsError} saveHandler={() => this.saveAll()} sending={this.state.sending} />
                    <TrainingSelect changeHandler={(training) => this.handleTrainingChange(training)} fatalError={this.props.fatalError}/>
                </div>
                {this.state.attendees.length > 0 ?
                    <div>
                        {this.state.attendees.map((g) =>
                            <PanelGroup>
                                <Panel collapsible expanded={this.state.attendeeGroup[g.label.id]} header={g.label.name} onClick={() => this.toggleGroup(g.label.id)}>
                                    <ListGroup>
                                        {g.entries.map((a) =>
                                            <ListGroupItem bsStyle={this.getBsStyle(a.attendee_id)} key={a.attendee_id} onClick={(e) => this.updateAttendance(a.attendee_id, e)}>
                                                {a.name}
                                            </ListGroupItem>
                                        )}
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

    toggleGroup(id) {
        let groupState = {...this.state.attendeeGroup};
        groupState[id] = !groupState[id];
        this.setState({
            attendeeGroup: groupState,
        });
    }
}

class AttendanceView extends Component {
    render() {
        let title = (<p>Wprowadzanie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.props.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                <AttendanceInput fatalError={this.props.fatalErrorHandler}/>
            </div>
        );
    }
}

export default Session(AttendanceView);
