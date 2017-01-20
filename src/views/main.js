import React, { Component } from 'react';
import AppNavigation from './main_admin';
import UserSummary from './main_user';
import AppHeader from '../components/header';
import Session from '../components/session';


class Main extends Component {
    render() {
        let navIntro;
        let main_view;
        if (this.props.session.role === 'admin') {
            navIntro = (
                <p className="content-to-hide">
                    Witamy w Training Attendance Tracker - aplikacji do zbierania danych dotyczących frekwencji treningowej oraz bieżących rozliczeń.
                </p>
            );
            main_view = (<AppNavigation fatalError={this.props.fatalErrorHandler}/>);
        }
        else {
            navIntro = (
                <p>
                    {this.props.session.user}
                </p>
            );
            main_view = (<UserSummary fatalError={this.props.fatalErrorHandler} user={this.props.session}/>);
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
