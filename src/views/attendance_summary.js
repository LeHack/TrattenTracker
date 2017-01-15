import React, { Component } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import AppHeader from '../components/header';
import AttendeeList, { getAttendeeById } from '../components/attendee_list';
import Session from '../components/session';
import utils from '../utils';
import './attendance_summary.css';

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
        let aid = nextProps.attendee.attendee_id;
        utils.fetchAttendanceSplitSummary(aid, (data) => function(self, aid, data){
            self.setState({
                details: data.stats[aid],
            });
        }(this, aid, data), this.props.fatalError);
    }

    render() {
        return (
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.close}>
                    <Modal.Header>
                        <Modal.Title>{this.props.attendee.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
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
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.props.close}>Zamknij</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

class AttendeeSummaryList extends AttendeeList {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            stats: {},
            detailView: null,
        };
    }

    handleGroupChange(groupId, event) {
        super.handleGroupChange(groupId, event);
        utils.fetchGroupAttendanceSummary(groupId, (data) => function(self, data){
            self.setState({
                stats: data.stats
            });
        }(this, data), this.props.fatalError);
    }

    renderHeaders() {
        return (
            <thead>
                <tr>
                    <th>Imię i nazwisko</th>
                    <th>Podstawowe</th>
                    <th>Dodatkowe</th>
                </tr>
            </thead>
        );
    }

    renderBody(rowData){
        // shortcuts
        let s = this.state.stats;
        let a = rowData;
        let aid = a.attendee_id;
        return (
            <tr key={aid} onClick={() => this.showDetails(aid)}>
                <td>{a.name}</td>
                <td>{s[aid] ? <span>{s[aid].basic.count} ({s[aid].basic.freq}%)</span> : "-"}</td>
                <td>{s[aid] ? <span>{s[aid].extra.count} ({s[aid].extra.freq}%)</span> : "-"}</td>
            </tr>
        );
    }

    renderExtraComponents() {
        // render the ShowDetails component
        let data = this.state.detailView;
        let showModal = true;
        if (data === null) {
            showModal = false;
            data = {
                attendee_id: 0,
                name: "..."
            };
        }
        return (
            <span>
                <ShowDetails showModal={showModal} attendee={data} close={() => this.hideDetails()} />
            </span>
        );
    }

    showDetails(id) {
        this.setState({ detailView: getAttendeeById(this.state.attendees, id) })
    }

    hideDetails() {
        this.setState({ detailView: null })
    }
}


class AttendanceSummary extends Session {
    constructor(props) {
        super(props);
        this.state = {
            session: { "user": null },
            errorStatus: false,
        };
    }

    render() {
        let title = (<p>Zestawienie obecności</p>);
        return (
            <div>
                <AppHeader viewJSX={title} session={this.state.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                {this.state.errorStatus ? <utils.Error reason="Nie można nawiązać połączenia z serwerem" /> : <AttendeeSummaryList fatalError={(error) => this.fatalErrorHandler(error)}/>}
            </div>
        );
    }
}

export default AttendanceSummary;