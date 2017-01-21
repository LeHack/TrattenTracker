import React, { Component } from 'react';
import { Button, ControlLabel, FormControl, FormGroup, Modal, ListGroupItem, ProgressBar } from 'react-bootstrap';
import update from 'immutability-helper';

import AppHeader  from '../components/header';
import Session from '../components/session';
import GroupAttendeeList from '../components/group_attendee_list';
import utils from '../utils';


class PaymentModal extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.toggleTax    = this.toggleTax.bind(this);
        this.toggleType   = this.toggleType.bind(this);
        this.save         = this.save.bind(this);
        this.state = {
            fee: null,
            type: "CASH",
            tax: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        // skip if we're just hiding
        if (!nextProps.showModal) {
            return
        }
        let aid = nextProps.data.attendee_id;
        utils.fetchMonthlyFee(aid, (data) => function(self, aid, data){
            self.setState({
                fee: data.amount,
            });
        }(this, aid, data), this.props.fatalError);
    }

    getValidationState() {
        const re = /^[0-9]+$/g;
        let output = 'success';
        if (!re.test(this.state.fee) || this.state.fee < 1 || this.state.fee > 500) {
            output = 'error';
        }
        return output;
    }

    handleChange(e) {
        this.setState({ fee: e.target.value });
    }

    toggleType(e) {
        e.stopPropagation();
        let nextType = 'CASH';
        if (this.state.type === nextType){
            nextType = 'TRANSFER';
        }
        this.setState({ type: nextType });
    }

    toggleTax(e) {
        e.stopPropagation();
        this.setState({ tax: !this.state.tax });
    }

    save() {
        if (this.getValidationState() !== 'success') {
            alert("Nie można zapisać formularza z błędami.");
            return;
        }
        let params = {
            attendee_id: this.props.data.attendee_id,
            amount: this.state.fee,
            tax: this.state.tax,
            type: this.state.type
        };
        utils.sendPayment(params, () => function(self){
            self.props.close();
        }(this), this.props.fatalError);
    }

    render() {
        let isLoading = (this.state.fee === null);
        return (
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.close}>
                    <Modal.Header>
                        <Modal.Title>{this.props.data.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {isLoading ?
                            <ProgressBar active label="Ładowanie..." now={100} />
                            :
							<form>
								<FormGroup controlId="formFee" validationState={this.getValidationState()}>
									<ControlLabel>Kwota</ControlLabel>
									<FormControl type="text" value={this.state.fee} placeholder="zł" onChange={this.handleChange} />
									<FormControl.Feedback />
								</FormGroup>
								<Button block bsStyle={this.state.tax ? "primary" : "danger" } onClick={this.toggleTax}>Zapisane na kasie fiskalnej</Button>
								<Button block onClick={this.toggleType}>{this.state.type === "CASH" ? "Gotówka" : "Przelew"}</Button>
							</form>
                        }
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.save}>Zapisz</Button>
                        <Button onClick={this.props.close}>Anuluj</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

class PaymentsInput extends Component {
    constructor(props) {
        super(props);

        this.renderRow         = this.renderRow.bind(this);
        this.getBsStyle        = this.getBsStyle.bind(this);
        this.hidePaymentForm   = this.hidePaymentForm.bind(this);
        this.fetchOutstanding  = this.fetchOutstanding.bind(this);
        this.shouldShowProgressBar = this.shouldShowProgressBar.bind(this);
        this.state = {
            showModal: false,
            modalData: {},
            balance: {},
            loaded: false,
        };
        this.balanceLoading = [];
    }

    fetchOutstanding(attendees) {
        for (let g of attendees) {
            this.balanceLoading[g.groupId] = true;
	        utils.fetchGroupOutstanding(g.groupId, (data) => function(self, data, gid){
                for (let aid of Object.keys(data.amount)) {
                    data.amount[aid] = {$set: data.amount[aid]};
                }
                let stateUpdate = {
                    balance: update(self.state.balance, data.amount)
                }
                // drop key and check if anything is left
                delete self.balanceLoading[gid];
                if (Object.keys( self.balanceLoading ).length === 0) {
                    stateUpdate["loaded"] = true;
                }
                self.setState(stateUpdate);
	        }(this, data, g.groupId), this.props.fatalError);
        }
    }

    showPaymentForm(attendee, e) {
        // make sure this click doesn't reach the panel container
        e.stopPropagation();
        this.setState({
            showModal: true,
            modalData: attendee,
        });
    }

    hidePaymentForm() {
        this.setState({ showModal: false });
    }

    getBsStyle(attendeeId) {
        let style = null;
        let balance = 0;
        if (attendeeId in this.state.balance) {
            balance = this.state.balance[attendeeId];
        }
        if (balance > 0) {
            style = "success";
        }
        else if (balance < 0) {
            style = "warning";
        }
        return style;
    }

    renderRow(attendee) {
	    return (
	        <ListGroupItem bsStyle={this.getBsStyle(attendee.attendee_id)} key={attendee.attendee_id} onClick={(e) => this.showPaymentForm(attendee, e)}>
	            {attendee.name}
	        </ListGroupItem>
        );
    }

    shouldShowProgressBar() {
        return !this.state.loaded;
    }

    render() {
        let title = (<p>Wprowadzanie płatności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.props.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                <GroupAttendeeList renderRow={this.renderRow} fatalError={this.fatalErrorHandler} runWithAttendees={this.fetchOutstanding} shouldShowProgressBar={this.shouldShowProgressBar}>
                    <PaymentModal showModal={this.state.showModal} data={this.state.modalData} close={this.hidePaymentForm} />
                </GroupAttendeeList>
            </div>
        );
    }
}

export default Session(PaymentsInput);
