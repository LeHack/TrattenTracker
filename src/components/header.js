import React from 'react';
import { Breadcrumb, Jumbotron } from 'react-bootstrap';
import cfg from '../route_config';
import './header.css';

function Login(props) {
    let userName = '';
    let loginLink = (<a href={props.login}>Login</a>);
    if (props.user != null) {
        userName = "Logged in as " + props.user;
        loginLink = (<a href={props.logout}>Logout</a>);
    }
    return (
        <div className="loginStatus">
          {userName} {loginLink}
        </div> 
    );
}

function AppHeader(props) {
    return (
        <div>
            <Jumbotron bsClass="jumbotron backdrop">
                <Login user={props.session.user} login="#" logout="#"/>
                <h1>TrAtten Tracker</h1>
                {props.viewJSX}
            </Jumbotron>
            {props.location &&
                <Breadcrumb>
                    <Breadcrumb.Item href={cfg.routes.main}>
                        Start
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>
                        {props.location}
                    </Breadcrumb.Item>
                </Breadcrumb>
            }
        </div>
    );
}

export default AppHeader;
