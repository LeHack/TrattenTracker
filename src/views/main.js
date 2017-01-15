import React from 'react';
import AppNavigation from './main_admin';
import UserSummary from './main_user';
import AppHeader from '../components/header';
import Session from '../components/session';
import utils from '../utils';

export default class Main extends Session {
    render() {
        let navIntro = (
            <p className="content-to-hide">
                Witamy w Training Attendance Tracker - aplikacji do zbierania danych dotyczących frekwencji treningowej oraz bieżących rozliczeń.
            </p>
        );
        let main_view;
        if (this.state.session.role === 'admin') {
            main_view = (<AppNavigation fatalError={(error) => this.fatalErrorHandler(error)}/>);
        }
        else {
            main_view = (<UserSummary fatalError={(error) => this.fatalErrorHandler(error)} user={this.state.session}/>);
        }
        return (
            <div>
                <AppHeader viewJSX={navIntro} session={this.state.session} routes={this.props.routes} params={this.props.params} />
                {this.state.errorStatus ? <utils.Error reason="Nie można nawiązać połączenia z serwerem" /> : main_view}
            </div>
        );
    }
}
