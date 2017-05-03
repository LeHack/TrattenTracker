import React, { Component } from 'react';
import { browserHistory } from 'react-router';

import AppHeader from '../components/header';
import Session from '../components/session';


class Main extends Component {
    componentWillMount() {
        let role = null;
        if (this.props.session) {
            role = this.props.session.role;
        }

        // check role and redirect
        if (role === 'ATTENDEE'){
            browserHistory.push('/zestawienie');
        }
        else if (role === 'SENSEI') {
            browserHistory.push('/admin/');
        }
    }

    render() {
        return (
            <div>
                <AppHeader session={this.props.session} routes={this.props.routes} params={this.props.params} />
                <h3>Aby uzyskać dostęp do aplikacji, musisz się zalogować.</h3>
            </div>
        );
    }
}

export default Session(Main);
