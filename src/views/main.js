import React from 'react';
import { Link } from 'react-router'
import AppHeader from '../components/header';
import { Nav } from 'react-bootstrap';
import Session from '../components/session';
import cfg from '../route_config';
import utils from '../utils';

/*
* http://usejsdoc.org/
*/

function NavItem(props) {
    return (
        <Link className="list-group-item" to={props.link}>
            <h4 className="list-group-item-heading">{props.label}</h4>
            <p className="list-group-item-text">{props.description}</p>
        </Link>
    );
}

function AppNavigation(props) {
    let navItems = {
        "admin": [
            {
                "label": "Obecności",
                "description": "Wprowadzanie nowych obecności przed/po treningu.",
                "link": cfg.routes.attendance
            },
            {
                "label": "Płatności",
                "description": "Wprowadzanie nowo otrzymanych płatności.",
                "link": cfg.routes.payment
            },
            {
                "label": "Zetawienie obecności",
                "description": "Statystyki frekwencji w wybranej grupie ćwiczących.",
                "link": cfg.routes.attendance_summary
            },
            {
                "label": "Zestawienie płatności",
                "description": "Przegląd aktualnego stanu rozliczeń dla wybranej grupy ćwiczących.",
                "link": cfg.routes.payment_summary
            },
        ],
        "user": []
    };

    let selItems='';
    if (navItems[props.mode]) {
        selItems = navItems[props.mode].map((item) =>
            <NavItem key={item.label} link={item.link} label={item.label} description={item.description} />
        );
    }
    return (
        <Nav bsClass="middle" bsStyle="pills" stacked>
            {selItems}
        </Nav>
    );
}

class Main extends Session {
    render() {
        let navIntro = (
            <p className="content-to-hide">
                Witamy w Training Attendance Tracker - aplikacji do zbierania danych dotyczących frekwencji treningowej oraz bieżących rozliczeń.
            </p>
        );
        return (
            <div>
                <AppHeader viewJSX={navIntro} session={this.state.session} routes={this.props.routes} params={this.props.params} />
                {this.state.errorStatus ? <utils.Error reason="Nie można nawiązać połączenia z serwerem" /> : <AppNavigation mode={this.state.session.mode} fatalError={(error) => this.fatalErrorHandler(error)}/>}
            </div>
        );
    }
}

export default Main;