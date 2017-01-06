import React, { Component } from 'react';

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
            <div className="jumbotron backdrop">
                <Login user={this.props.user} login="#" logout="#"/>
                <h1>Tratten Tracker</h1>
                <p>Welcome to the Training Attendance Tracker. Use one of the below options to navigate the application.</p>
            </div>
        );
    }
}

export default AppHeader;
