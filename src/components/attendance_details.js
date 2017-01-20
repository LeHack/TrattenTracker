import React, { Component } from 'react';
import { Button, Modal, ProgressBar, Table } from 'react-bootstrap';

import utils from '../utils';


export class AttendanceDetails extends Component {
    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
        this.state = {
            details: null
        };
    }

    componentWillReceiveProps(nextProps) {
        // skip if we're just hiding
        if (!nextProps.showModal) {
            return
        }
        let aid   = nextProps.data.attendee_id;
        let month = nextProps.data.month;
        utils.fetchMonthlyAttendance(aid, month, (data) => function(self, aid, data){
            self.setState({
                details: data.attendance,
            });
        }(this, aid, data), this.props.fatalError);
    }

    close() {
        setTimeout(() => function(self) {
            self.setState({ details: null });
        }(this), 600);
    }

    render() {
        let isLoading = (this.state.details === null);
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
                            <Table responsive striped>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Trening</th>
                                        {this.props.isAdmin && <th>Dodane</th>}
                                        {this.props.data.card && <th>Karta</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.details.map((det, index) =>
                                        <tr key={det.date}>
                                            <td>{index+1}</td>
                                            <td>{det.date}</td>
                                            {this.props.isAdmin && <td>{det.added}</td>}
                                            {this.props.data.card && <td>{det.sport_card ? "Tak" : <b>Nie</b>}</td>}
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        }
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.props.close}>Zamknij</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}
