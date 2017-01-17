import React, { Component } from 'react';
import { Button, ButtonGroup, Collapse, Modal, ProgressBar, ListGroup, ListGroupItem } from 'react-bootstrap';
import AppHeader  from '../components/header';
import Session from '../components/session';
import utils from '../utils';

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

class PaymentModal extends Component {
    componentWillReceiveProps(nextProps) {
        // skip if we're just hiding
        if (!nextProps.showModal) {
            return
        }
        let aid   = nextProps.data.attendee_id;
//        utils.fetchMonthlyAttendance(aid, (data) => function(self, aid, data){
//            console.log(data);
//            self.setState({
//                details: data.attendance,
//            });
//        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.close}>
                    <Modal.Header>
                        <Modal.Title>{this.props.data.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        Payment form...
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.props.close}>Zamknij</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}


class AttendeeList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            attendees: [],
            attendeeGroup: {},
            attendance: {},
            commsError: false,
            sending: false,
            showModal: false,
            modalData: {}
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

    getAttendeeById(id) {
        let selected = null;
        for (let g of this.state.attendees) {
            for (let a of g.entries) {
                if (a.attendee_id === id) {
                    selected = a;
                    break;
                }
            }
        }
        return selected;
    }

    render() {
        return (
            <div>
                <div className="controlBar">
                    <SaveChanges disabled={!this.state.commsError} saveHandler={() => this.saveAll()} sending={this.state.sending} />
                </div>
                {this.state.attendees.length > 0 ?
                    <div>
                    {this.state.attendees.map((g) =>
                        <div className="lists" key={g.label.id}>
                            <ListGroup>
                                <ListGroupItem header={g.label.name} onClick={() => this.toggleGroup(g.label.id)} active={true}/>
                            </ListGroup>
                            <Collapse in={this.state.attendeeGroup[g.label.id]}>
                                <ListGroup>
                                    {g.entries.map((a) =>
                                        <ListGroupItem key={a.attendee_id} onClick={() => this.showPaymentForm(a.attendee_id)}>
                                            {a.name}
                                        </ListGroupItem>
                                    )}
                                </ListGroup>
                            </Collapse>
                        </div>
                    )}
                    <PaymentModal showModal={this.state.showModal} data={this.state.modalData} close={() => this.hidePaymentForm()} />
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

    showPaymentForm(id) {
        this.setState({
            showModal: true,
            modalData: this.getAttendeeById(id),
        });
    }

    hidePaymentForm(id) {
        this.setState({ showModal: false });
    }
}

class Payments extends Session {
    constructor(props) {
        super(props);
        this.state = {
            session: { "user": null },
            errorStatus: false,
        };
    }

    fatalErrorHandler(error) {
        console.log("Debug", error);
        this.setState({errorStatus: true});
    }

    render() {
        let title = (<p>Wprowadzanie płatności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.state.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                {this.state.errorStatus ? <utils.Error reason="Nie można nawiązać połączenia z serwerem" /> : <AttendeeList fatalError={(error) => this.fatalErrorHandler(error)}/>}
            </div>
        );
    }
}

export default Payments;