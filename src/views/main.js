import React, { Component } from 'react';
import AppNavigation from './main_admin';
import UserSummary from './main_user';
import AppHeader from '../components/header';
import Session from '../components/session';


class Main extends Component {
    render() {
        let navIntro;
        let main_view;
        let role = null;
        if (this.props.session) {
            role = this.props.session.role;
        }

        if (role === 'SENSEI') {
            navIntro = (
                <p className="content-to-hide">
                    Witamy w Training Attendance Tracker - aplikacji do zbierania danych dotyczących frekwencji treningowej oraz bieżących rozliczeń.
                </p>
            );
            main_view = (<AppNavigation fatalError={this.props.fatalErrorHandler}/>);
        }
        else if (role === 'ATTENDEE'){
            navIntro = (
                <p>
                    {this.props.session.user}
                </p>
            );
            main_view = (<UserSummary fatalError={this.props.fatalErrorHandler} user={this.props.session}/>);
        }
        else {
            navIntro = (<p>Logowanie wymagane</p>);
            main_view = (<h3>Aby uzyskać dostęp do aplikacji, musisz się zalogować.</h3>);
        }
        return (
            <div>
                <AppHeader viewJSX={navIntro} session={this.props.session} routes={this.props.routes} params={this.props.params} />
                {main_view}
            </div>
        );
    }
}

export default Session(Main);
