import React, { Component } from 'react';
import { Panel, PanelGroup, ProgressBar, Table } from 'react-bootstrap';
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

class UserAttendance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            details: [],
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
                        <tr key={det.month}>
                            <td>{det.month}</td>
                            <td>{det.basic.count} ({det.basic.freq}%)</td>
                            <td>{det.extra.count} ({det.extra.freq}%)</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        );
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
        return (
            <Table responsive striped>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Rodzaj</th>
                        <th>Kwota</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.payments.map((det) =>
                        <tr key={det.date}>
                            <td>{det.date}</td>
                            <td>{det.type}</td>
                            <td>{det.amount} zł</td>
                        </tr>
                    )}
                </tbody>
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
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.user !== null) {
            this.setState({user: nextProps.user})
        }
    }

    render() {
        return (
            <div>
                {this.state.user ?
                    <PanelGroup accordion defaultActiveKey="1">
                        <Panel header="Zestawienie" eventKey="1">
                            <Summary fatalError={this.props.fatalError} user={this.props.user}/>
                        </Panel>
                        <Panel header="Obecności" eventKey="2">
                            <UserAttendance fatalError={this.props.fatalError} user={this.props.user} />
                        </Panel>
                        <Panel header="Płatności" eventKey="3">
                            <UserPayments fatalError={this.props.fatalError} user={this.props.user} />
                        </Panel>
                    </PanelGroup>
                    : <ProgressBar active label="Ładowanie..." now={100} />
                }
            </div>
        );
    }
}
