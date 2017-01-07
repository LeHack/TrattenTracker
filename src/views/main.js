import React, { Component } from 'react';
import { Link } from 'react-router'
import AppHeader  from '../components/header';
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
                "description": "Wprowadzanie nowo otrzmanych płatności.",
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
        <div className="col-sm-4 middle">
            <div className="list-group">
                {selItems}
            </div>
        </div>
    );
}

class Main extends Component {
    constructor() {
        super();
        this.state = {
            session: { user: null, mode: null }
        };
    }

    handleSession(session) {
        this.setState({
            session: session
        });
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => this.handleSession(session));
    }

    render() {
        return (
            <div>
                <AppHeader user={this.state.session.user}/>
                <AppNavigation mode={this.state.session.mode}/>
            </div>
        );
    }
}

export default Main;