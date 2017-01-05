import React, { Component } from 'react';
import './App.css';
import 'react-bootstrap';

function MenuBar(props) {
    return (
      <a href={props.link} className="list-group-item">
        <h4 className="list-group-item-heading">{props.label}</h4>
        <p className="list-group-item-text">{props.description}</p>
      </a>
    );
}

function fetchSessionStatus(sessionHandler) {
    // fetch session data via http://trattentracker.pl:8000/rest/session
    window.fetch('/rest/session')
    .then(function(response) {
        return response.json()
    }).then(function(json) {
        sessionHandler(json);
    }).catch(function(ex) {
        console.log('parsing failed', ex)
    });
}

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

class App extends Component {
    constructor() {
        super();
        this.state = {
            session: { user: null }
        };
    }

    handleSession(session) {
        this.setState({
            session: session
        });
    }

    componentDidMount() {
        fetchSessionStatus((session) => this.handleSession(session));
    }

  render() {
    let appNavigation = "";
    if (this.state.session.user != null) {
      appNavigation = (
        <div className="col-sm-4 middle">
          <div className="list-group">
            <MenuBar link="#" label="Attendance" description="Enter new attendance data before/after every training." />
            <MenuBar link="#" label="Payment" description="Enter information regarding new payments." />
            <MenuBar link="#" label="Attendace summary" description="Review current attendance stats for the selected training group." />
            <MenuBar link="#" label="Payment summary" description="Review current payment status for the selected training group." />
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="jumbotron backdrop">
          <Login user={this.state.session.user} login="#" logout="#"/>
          <h1>Tratten Tracker</h1>
          <p>Welcome to the Training Attendance Tracker. Use one of the below options to navigate the application.</p>
        </div>
        {appNavigation}
      </div>
    );
  }
}

export default App;
