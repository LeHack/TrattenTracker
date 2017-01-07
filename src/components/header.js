import React, { Component } from 'react';
import { Jumbotron } from 'react-bootstrap';

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

class AppHeader extends Component {
    render() {
        return (
            <Jumbotron bsClass="jumbotron backdrop">
                <Login user={this.props.user} login="#" logout="#"/>
                <h1>Tratten Tracker</h1>
                <p className="content-to-hide">Welcome to the Training Attendance Tracker. Use one of the below options to navigate the application.</p>
            </Jumbotron>
        );
    }
}

export default AppHeader;
