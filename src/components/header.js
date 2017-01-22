import React from 'react';
import { Jumbotron } from 'react-bootstrap';
import Breadcrumbs from 'react-breadcrumbs';
import '../css/header.css';

function Login(props) {
    let userName = '';
    let loginLink = (<a href={props.login}>Login</a>);
    if (props.user != null) {
        userName = (<span className="content-to-hide">Logged in as {props.user.name}</span>);
        loginLink = (<a href="#" onClick={props.user.logoutHandler}>Logout</a>);
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
                <Login user={props.session} login="#" logout="#"/>
                <h1>TrAtten Tracker</h1>
                {props.viewJSX}
            </Jumbotron>
            {props.showBreadcrumbs &&
                <Breadcrumbs separator=" / " routes={props.routes} params={props.params} setDocumentTitle={true}/>
            }
            {props.children}
        </div>
    );
}

export default AppHeader;
