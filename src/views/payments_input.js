import React, { Component } from 'react';
import { Button, Modal, ListGroupItem } from 'react-bootstrap';
// import update from 'immutability-helper';

import AppHeader  from '../components/header';
import Session from '../components/session';
import GroupAttendeeList from '../components/group_attendee_list';
// import utils from '../utils';


class PaymentModal extends Component {
    componentWillReceiveProps(nextProps) {
        // skip if we're just hiding
        if (!nextProps.showModal) {
            return
        }
//        let aid   = nextProps.data.attendee_id;
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
