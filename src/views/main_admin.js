import React from 'react';
import { Link } from 'react-router'
import { Nav } from 'react-bootstrap';
import cfg from '../route_config';

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

export default function AppNavigation(props) {
    let navItems = [
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
    ];

    return (
        <Nav bsClass="middle" bsStyle="pills" stacked>
            {navItems.map((item) =>
                <NavItem key={item.label} link={item.link} label={item.label} description={item.description} />
            )}
        </Nav>
    );
}
