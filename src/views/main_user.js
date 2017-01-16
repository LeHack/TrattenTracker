import React, { Component } from 'react';
import { Button, Modal, Panel, PanelGroup, ProgressBar, Table } from 'react-bootstrap';
import utils from '../utils';
import './main_user.css';

class Summary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            payment: "...",
            basic: { count: "...", freq: "..." },
            extra: { count: "...", freq: "..." },
        };
    }

    componentDidMount() {
        let aid = this.props.user.attendee_id;
        utils.fetchAttendanceSummary(aid, (data) => function(self, aid, data){
            self.setState({
                basic: data.stats[aid].basic,
                extra: data.stats[aid].extra
            });
        }(this, aid, data), this.props.fatalError);
        utils.fetchOutstanding(aid, (data) => function(self, aid, data){
            self.setState({
                payment: data.amount[aid]
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <Table responsive striped>
                <tbody>
                    <tr>
                        <td>Bilans płatności:</td>
                        <td colSpan="2">{this.state.payment} zł</td>
                    </tr>
                    <tr>
                        <td>Frekwencja:</td>
                        <td>Podstawowa</td>
                        <td>Dodatkowa</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{this.state.basic.count} ({this.state.basic.freq}%)</td>
                        <td>{this.state.extra.count} ({this.state.extra.freq}%)</td>
                    </tr>
                </tbody>
            </Table>
        );
    }
}

class ShowDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            details: []
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
            console.log(data);
            self.setState({
                details: data.attendance,
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.close}>
                    <Modal.Header>
                        <Modal.Title>{this.props.data.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Table responsive striped>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Trening</th>
                                    {this.props.data.card && <th>Karta</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.details.map((det, index) =>
                                    <tr key={det.date}>
                                        <td>{index+1}</td>
                                        <td>{det.date}</td>
                                        {this.props.data.card && <td>{det.sport_card ? "Tak" : <b>Nie</b>}</td>}
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.props.close}>Zamknij</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

class UserAttendance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            details: [],
            showModal: false,
            modalData: {},
        };
    }

    componentDidMount() {
        let aid = this.props.user.attendee_id;
        utils.fetchAttendanceSplitSummary(aid, (data) => function(self, aid, data){
            self.setState({
                details: data.stats[aid],
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <span>
                <Table responsive striped>
                    <thead>
                        <tr>
                            <th>Miesiąc</th>
                            <th>Podst.</th>
                            <th>Dodat.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.details.map((det) =>
                            <tr key={det.month} onClick={() => this.showDetails(det)}>
                                <td>{det.month}</td>
                                <td>{det.basic.count} ({det.basic.freq}%)</td>
                                <td>{det.extra.count} ({det.extra.freq}%)</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                <ShowDetails showModal={this.state.showModal} data={this.state.modalData} close={() => this.hideDetails()} />
            </span>
        );
    }

    showDetails(detailRow) {
        this.setState({
            showModal: true,
            modalData: {
                name: detailRow.month,
                month: detailRow.raw_month,
                attendee_id: this.props.user.attendee_id,
                card: this.props.user.sport_card,
            },
        });
    }

    hideDetails() {
        this.setState({ showModal: false });
    }
}

class UserPayments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            payments: [],
        };
    }

    componentDidMount() {
        let aid = this.props.user.attendee_id;
        utils.fetchPayments(aid, (data) => function(self, aid, data){
            self.setState({
                payments: data.payments,
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        let hasPayments = (this.state.payments.length > 0);
        return (
            <Table responsive striped>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Rodzaj</th>
                        <th>Kwota</th>
                    </tr>
                </thead>
                {hasPayments ?
                    <tbody>
                        {this.state.payments.map((det) =>
                            <tr key={det.date}>
                                <td>{det.date}</td>
                                <td>{det.type}</td>
                                <td>{det.amount} zł</td>
                            </tr>
                        )}
                    </tbody>
                    :
                    <tbody>
                        <tr>
                            <td colSpan="3" className="center">Brak danych.</td>
                        </tr>
                    </tbody>
                }
            </Table>
        );
    }
}


export default class UserSummary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: false,
            summary: true,
            attendance: true,
            payments: true,
            selected: 1,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.user !== null) {
            this.setState({user: nextProps.user});
        }
    }

    changePanel(i) {
        if (this.state.selected !== i) {
            this.setState({selected: i});
        }
    }

    render() {
        return (
            <div>
                {this.state.user ?
                    <PanelGroup accordion defaultActiveKey="1" activeKey={""+this.state.selected}>
                        <Panel header="Zestawienie" eventKey="1" onClick={() => this.changePanel(1)}>
                            <Summary fatalError={this.props.fatalError} user={this.props.user}/>
                        </Panel>
                        <Panel header="Obecności" eventKey="2" onClick={() => this.changePanel(2)}>
                            <UserAttendance fatalError={this.props.fatalError} user={this.props.user} />
                        </Panel>
                        <Panel header="Płatności" eventKey="3" onClick={() => this.changePanel(3)}>
                            <UserPayments fatalError={this.props.fatalError} user={this.props.user} />
                        </Panel>
                    </PanelGroup>
                    : <ProgressBar active label="Ładowanie..." now={100} />
                }
            </div>
        );
    }
}
