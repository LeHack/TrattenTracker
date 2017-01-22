import React, { Component } from 'react';
import { DropdownButton, MenuItem, ListGroupItem } from 'react-bootstrap';
import update from 'immutability-helper';

import AppHeader  from '../components/header';
import Session from '../components/session';
import { SaveChanges } from '../components/save_button';
import GroupAttendeeList from '../components/group_attendee_list';
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

class AttendanceInput extends Component {
    constructor(props) {
        super(props);

        this.shouldShowProgressBar = this.shouldShowProgressBar.bind(this);
        this.handleTrainingChange  = this.handleTrainingChange.bind(this);
        this.findSportCardUsers    = this.findSportCardUsers.bind(this);
        this.discardAll = this.discardAll.bind(this);
        this.renderRow  = this.renderRow.bind(this);
        this.saveAll    = this.saveAll.bind(this);
        this.state = {
            attendance: {},
            sportCards: {},
            training: null,
            sending: false,
            unsavedData: null,
            loaded: false,
        };
    }

    findSportCardUsers(attendees) {
        let sportCards = {};
        for (let g of attendees) {
            for (let a of g.entries) {
                if (!(a.attenee_id in sportCards)) {
                    sportCards[a.attendee_id] = {}
                }
                sportCards[a.attendee_id]['owns'] = a.sport_card;
            }
        }

        // if every group has been processed, join and update state
        this.setState({ sportCards: sportCards });
    }

    handleTrainingChange(training, force) {
        let change = force || !this.state.unsavedData || alert("Nie wszystkie dane zostały zapisane. Najpierw zatwierdź lub anuluj niezachowane zmiany.");
        if (change) {
            this.setState({loaded: false});
            // define a function to fetch and handle attendance data
            let handleAttendance = function(self, data) {
                // make sure we have sportCards loaded
                let loaded = (Object.keys(self.state.sportCards).length > 0);
                if (!loaded) {
                    // retry after a small delay (100 ms)
                    setTimeout(() => handleAttendance(self, data), 100);
                }
                else {
                    // call REST backend for attendance data
                    let attendance = {};
                    let sportCards = {...self.state.sportCards};
                    for (let att of data.attendance) {
                        attendance[att.attendee_id] = true;
                        sportCards[att.attendee_id]['used'] = att.sport_card;
                    }
                    self.setState({
                        attendance: attendance,
                        training: training,
                        sportCards: sportCards,
                        loaded: true,
                    });
                }
            }
            // now run the REST call and then use our function for processing
            // if the sportCard data is not available, it will wait and retry
            utils.fetchTrainingAttendance(training.date, training.time, (data) => function(self, data){
                handleAttendance(self, data);
            }(this, data), this.props.fatalErrorHandler);
        }
        return change;
    }

    updateAttendance(attendeeId, e) {
        // make sure this click doesn't reach the panel container
        e.stopPropagation();
        e.target.blur();
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
        let send = !this.state.unsavedData;
        this.setState({
            attendance: attendance,
            sportCards: sportCard,
            sending: send,
        });
        let dataPack = {
            attendee_id: attendeeId,
            is_present: isPresent,
            has_sport_card: (ownsSportCard && usedSportCard)
        };
        // now send the data to backend
        if (send) {
            utils.sendAttendance({
                training: this.state.training,
                attendance: [dataPack],
            },
            (ex) => function(ex, self, dataPack) {
                console.log('Sending attendance data failed with', ex);
                let unsaved = (self.state.unsavedData || {});
                self.setState({
                    sending: false,
                    unsavedData: update(unsaved, {
                        [attendeeId]: {$set: dataPack}
                    }),
                });
            }(ex, this, dataPack),
            () => function(self){
                self.setState({sending: false});
            }(this));
        }
        else {
            // only store as unsaved data
            this.setState({
                unsavedData: update(this.state.unsavedData, {
                    [attendeeId]: {$set: dataPack}
                }),
            });
        }

        return false;
    }

    saveAll() {
        // ensure we have anything to send
        let unsaved = this.state.unsavedData;
        if (!unsaved) {
            return;
        }
        console.log("Got unsaved data", this.state.unsavedData);
        // convert a list
        let attendance = [];
        for (let aid in unsaved) {
            if (unsaved.hasOwnProperty(aid)) {
                attendance.push( unsaved[aid] );
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
            self.setState({sending: false});
            alert("Serwer nie odpowiada. Prosimy spróbować później.");
        }(ex, this),
        (result) => function(self, result) {
            // on success, reset sending and unsavedData
            self.setState({sending: false, unsavedData: null});
        }(this, result));
    }

    discardAll() {
        // reset state
        this.setState({sending: false, unsavedData: null, loaded: false});
        // force refreshing the view
        this.handleTrainingChange(this.state.training, true);
    }

    getBsStyle(attendeeId) {
        let isPresent     = this.state.attendance[attendeeId];
        let sportCardInfo = this.state.sportCards[attendeeId];
        let ownsSportCard = (sportCardInfo && sportCardInfo['owns']);
        let usedSportCard = (sportCardInfo && sportCardInfo['used']);

        let style = null;
        if (isPresent && ownsSportCard && !usedSportCard) {
            style = "danger";
        }
        else if (isPresent) {
            style = "info";
        }

        return style;
    }

    renderRow(a) {
        return (
            <ListGroupItem bsStyle={this.getBsStyle(a.attendee_id)} key={a.attendee_id} onClick={(e) => this.updateAttendance(a.attendee_id, e)}>
                {a.name}
            </ListGroupItem>
        );
    }

    shouldShowProgressBar() {
        return !this.state.loaded;
    }

    render() {
        let title = (<p>Wprowadzanie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.props.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                <GroupAttendeeList renderRow={this.renderRow} fatalError={this.props.fatalErrorHandler} runWithAttendees={this.findSportCardUsers} shouldShowProgressBar={this.shouldShowProgressBar}>
                    <div className="controlBar">
                        <SaveChanges disabled={!this.state.unsavedData} saveHandler={this.saveAll} discardHandler={this.discardAll} sending={this.state.sending} />
                        <TrainingSelect changeHandler={this.handleTrainingChange} fatalError={this.props.fatalError}/>
                    </div>
                </GroupAttendeeList>
            </div>
        );
    }
}

export default Session(AttendanceInput);
