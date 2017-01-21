import React, { Component } from 'react';
import { Button, ControlLabel, FormControl, FormGroup, Modal, ListGroupItem, ProgressBar } from 'react-bootstrap';
// import update from 'immutability-helper';

import AppHeader  from '../components/header';
import Session from '../components/session';
import GroupAttendeeList from '../components/group_attendee_list';
import utils from '../utils';


class PaymentModal extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.save         = this.save.bind(this);
        this.state = {
            fee: null,
        };
    }

    componentWillReceiveProps(nextProps) {
        // skip if we're just hiding
        if (!nextProps.showModal) {
            return
        }
        let aid = nextProps.data.attendee_id;
        utils.fetchMonthlyFee(aid, (data) => function(self, aid, data){
            console.log(aid, data);
            self.setState({
                fee: data.amount,
            });
        }(this, aid, data), this.props.fatalError);
    }

    getValidationState() {
        const re = /^[0-9]+$/g;
        let output = 'success';
        if (!re.test(this.state.fee)) {
            output = 'error';
        }
        return output;
    }

    handleChange(e) {
        this.setState({ fee: e.target.value });
    }

    save() {
        console.log("Zapis płatności: ", this.state.fee);
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
								<FormGroup controlId="formBasicText" validationState={this.getValidationState()}>
									<ControlLabel>Kwota</ControlLabel>
									<FormControl type="text" value={this.state.fee} placeholder="zł" onChange={this.handleChange} />
									<FormControl.Feedback />
								</FormGroup>
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
        this.hidePaymentForm   = this.hidePaymentForm.bind(this);
        this.state = {
            showModal: false,
            modalData: {},
        };
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

    renderRow(attendee) {
	    return (
	        <ListGroupItem key={attendee.attendee_id} onClick={(e) => this.showPaymentForm(attendee, e)}>
	            {attendee.name}
	        </ListGroupItem>
        );
    }

    render() {
        let title = (<p>Wprowadzanie płatności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.props.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                <GroupAttendeeList renderRow={this.renderRow} fatalError={this.fatalErrorHandler}>
                    <PaymentModal showModal={this.state.showModal} data={this.state.modalData} close={this.hidePaymentForm} />
                </GroupAttendeeList>
            </div>
        );
    }
}

export default Session(PaymentsInput);
