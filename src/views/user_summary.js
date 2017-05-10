import React, { Component } from 'react';
import { Glyphicon, Panel, PanelGroup, ProgressBar, Table } from 'react-bootstrap';

import { AttendanceDetails } from '../components/attendance_details';
import AppHeader from '../components/header';
import Session from '../components/session';
import utils from '../utils';
import '../css/user_summary.css';

class Summary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            payment: "...",
            monthly_fee: "...",
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
                payment: data.attendee[aid].outstanding,
                monthly_fee: data.attendee[aid].monthly,
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <Table responsive striped>
                <tbody>
                    <tr>
                        <td>Opłata miesięczna:</td>
                        <td colSpan="2">{this.state.monthly_fee} zł {this.props.user.sport_card && <span>(karta sportowa)</span> }</td>
                    </tr>
                    <tr>
                        <td>Bieżący bilans:</td>
                        <td colSpan="2">{this.state.payment} zł</td>
                    </tr>
                    { this.props.user.payments.extra &&
                        <tr>
                            <td>Opłaty dodatkowe:</td>
                            <td>Staż</td>
                            <td>Egzamin</td>
                        </tr>
                    }
                    { this.props.user.payments.extra &&
                        <tr>
                            <td></td>
                            <td>{this.props.user.payments.seminar ? <Glyphicon glyph='ok' /> : <Glyphicon glyph='remove' />}</td>
                            <td>{this.props.user.payments.exam    ? <Glyphicon glyph='ok' /> : <Glyphicon glyph='remove' />}</td>
                        </tr>
                    }
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

        this.hideDetails = this.hideDetails.bind(this);
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
                            <tr key={det.month} onClick={(e) => this.showDetails(det, e)}>
                                <td>{det.month}</td>
                                <td>{det.basic.count} ({det.basic.freq}%)</td>
                                <td>{det.extra.count} ({det.extra.freq}%)</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                <AttendanceDetails showModal={this.state.showModal} data={this.state.modalData} close={this.hideDetails} ref='details' />
            </span>
        );
    }

    showDetails(detailRow, e) {
        e.stopPropagation();
        e.target.blur();
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
        this.refs.details.close();
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


class UserSummary extends Component {
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

    componentDidMount() {
        this.setState({user: this.props.session});
    }

    changePanel(i) {
        if (this.state.selected !== i) {
            this.setState({selected: i});
        }
    }

    render() {
        let navIntro = (
            <p>
                {this.props.session.name}
            </p>
        );
        return (
            <div>
                <AppHeader viewJSX={navIntro} session={this.props.session} routes={this.props.routes} params={this.props.params} />
                {this.state.user ?
                    <PanelGroup accordion defaultActiveKey="1" activeKey={""+this.state.selected}>
                        <Panel header="Zestawienie" eventKey="1" onClick={() => this.changePanel(1)}>
                            <Summary fatalError={this.props.fatalError} user={this.state.user}/>
                        </Panel>
                        <Panel header="Obecności" eventKey="2" onClick={() => this.changePanel(2)}>
                            <UserAttendance fatalError={this.props.fatalError} user={this.state.user} />
                        </Panel>
                        <Panel header="Płatności" eventKey="3" onClick={() => this.changePanel(3)}>
                            <UserPayments fatalError={this.props.fatalError} user={this.state.user} />
                        </Panel>
                    </PanelGroup>
                    : <ProgressBar active label="Ładowanie panelu użytkownika..." now={100} />
                }
            </div>
        );
    }
}

export default Session(UserSummary);