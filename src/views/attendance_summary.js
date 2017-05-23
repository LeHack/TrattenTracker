import React, { Component } from 'react';
import { Button, Modal, ProgressBar, Table } from 'react-bootstrap';
import update from 'immutability-helper';

import AppHeader from '../components/header';
import AuthorizedComponent from '../components/authorized_component';
import { AttendanceDetails } from '../components/attendance_details';
import GroupAttendeeList from '../components/group_attendee_list';
import Session from '../components/session';
import utils from '../utils';
import '../css/attendance_summary.css';


class SplitByMonth extends Component {
    constructor(props) {
        super(props);

        this.close       = this.close.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.state = {
            details: null,
            showModal: false,
            modalData: {},
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

    close() {
        setTimeout(() => function(self) {
            self.setState({ details: null });
        }(this), 600);
    }

    render() {
        let isLoading = (this.state.details === null);
        let isAdmin   = (this.props.user && this.props.user.role === "admin");
        return (
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.close}>
                    <Modal.Header>
                        <Modal.Title>{this.props.attendee.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {isLoading ?
                            <ProgressBar active label="Ładowanie..." now={100} />
                            :
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
                        }
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.props.close}>Zamknij</Button>
                    </Modal.Footer>
                </Modal>
                <AttendanceDetails showModal={this.state.showModal} data={this.state.modalData} close={this.hideDetails} isAdmin={isAdmin} ref='details' />
            </div>
        );
    }

    showDetails(detailRow) {
        this.setState({
            showModal: true,
            modalData: {
                name: detailRow.month,
                month: detailRow.raw_month,
                attendee_id: this.props.attendee.attendee_id,
                card: this.props.attendee.sport_card,
            },
        });
    }

    hideDetails() {
        this.setState({ showModal: false });
        this.refs.details.close();
    }
}

class AttendanceSummary extends Component {
    constructor(props) {
        super(props);

        this.shouldShowProgressBar = this.shouldShowProgressBar.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.renderBody  = this.renderBody.bind(this);
        this.fetchStats  = this.fetchStats.bind(this);
        this.state = {
            stats: {},
            detailView: null,
            loaded: false,
        };
        this.statsLoading = {};
    }

    fetchStats(attendees) {
        for (let i = 0; i < attendees.length; i++){
            let g = attendees[i];
            this.statsLoading[g.groupId] = true;
            utils.fetchGroupAttendanceSummary(g.groupId, (data) => function(self, data, gid){
                let attIds = Object.keys(data.stats);
                for (let j = 0; j < attIds.length; j++){
                    let aid = attIds[j];
                    data.stats[aid] = {$set: data.stats[aid]};
                }
                let stateUpdate = {
                    stats: update(self.state.stats, data.stats)
                }
                // drop key and check if anything is left
                delete self.statsLoading[gid];
                if (Object.keys( self.statsLoading ).length === 0) {
                    stateUpdate["loaded"] = true;
                }
                self.setState(stateUpdate);
            }(this, data, g.groupId), this.props.fatalError);
        }
    }

    renderBody(entries) {
        return (
            <Table responsive striped>
                <thead>
                    <tr>
                        <th>Imię i nazwisko</th>
                        <th>Podstawowe</th>
                        <th>Dodatkowe</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((a) => this.renderRow(a) )}
                </tbody>
            </Table>
        );
    }

    renderRow(attendee) {
        let s = this.state.stats;
        let a = attendee;
        let aid = a.attendee_id;
        return (
            <tr key={aid} onClick={(e) => this.showDetails(a, e)}>
                <td>{a.name}</td>
                <td>{s[aid] ? <span>{s[aid].basic.count} ({s[aid].basic.freq}%)</span> : "-"}</td>
                <td>{s[aid] ? <span>{s[aid].extra.count} ({s[aid].extra.freq}%)</span> : "-"}</td>
            </tr>
        );
    }

    shouldShowProgressBar() {
        return !this.state.loaded;
    }

    render() {
        let title = (<p>Zestawienie obecności</p>);
        // render the SplitByMonth component
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
            <div>
                <AppHeader viewJSX={title} session={this.props.session} routes={this.props.routes} params={this.props.params} showBreadcrumbs />
                <GroupAttendeeList renderBody={this.renderBody} renderRow={this.renderRow} fatalError={this.fatalErrorHandler} runWithAttendees={this.fetchStats} shouldShowProgressBar={this.shouldShowProgressBar}>
                    <SplitByMonth showModal={showModal} attendee={data} close={this.hideDetails} user={this.props.session} ref='details'/>
                </GroupAttendeeList>
            </div>
        );
    }

    showDetails(attendee, e) {
        // make sure this click doesn't reach the panel container
        e.stopPropagation();
        e.target.blur();
        this.setState({ detailView: attendee });
    }

    hideDetails() {
        this.setState({ detailView: null });
        this.refs.details.close();
    }
}

export default Session(AuthorizedComponent(AttendanceSummary));
