import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Button, ControlLabel, FormControl, FormGroup, Modal, ProgressBar } from 'react-bootstrap';

import AppHeader from './header';
import ErrorMsg from './error';
import utils from '../utils';


var Session = ComposedComponent => class extends Component {
    constructor(props) {
        super(props);

        this.fatalErrorHandler = this.fatalErrorHandler.bind(this);
        this.fetchSession      = this.fetchSession.bind(this);
        this.logoutHandler     = this.logoutHandler.bind(this);
        this.state = {
            errorStatus: null,
            session: null,
        };
    }

    fatalErrorHandler(error) {
        if (error instanceof Response) {
            error = "Nie można nawiązać połączenia z serwerem."
        }
        this.setState({errorStatus: error});
    }

    fetchSession() {
        let storedSession = JSON.parse(localStorage.getItem('session'));
        if (!storedSession || storedSession.timestamp + 300000 < new Date().getTime()) {
            utils.fetchSessionStatus((session) => function(self, session){
                session.logoutHandler = self.logoutHandler;
                self.setState({ session: session });
                if (session['logged in']) {
                    session.timestamp = new Date().getTime();
                    localStorage.setItem('session', JSON.stringify(session));
                }
            }(this, session), this.fatalErrorHandler);
        }
        else {
            // refresh handler
            storedSession.logoutHandler = this.logoutHandler;
            this.setState({ session: storedSession });
        }
    }

    logoutHandler() {
        utils.logout(() => function(self){
            localStorage.removeItem('session');
            browserHistory.push('/');
        }(this), this.fatalErrorHandler);
    }

    componentDidMount() {
        this.fetchSession();
    }

    render() {
        let result = null;
        // handle fatal communication errors
        if (this.state.errorStatus) {
            result = (
                <AppHeader session={this.state.session}>
                    <ErrorMsg reason={this.state.errorStatus} />
                </AppHeader>
            );
        }
        // handle missing session
        else if (this.state.session === null) {
            result = (
                <AppHeader session={this.state.session}>
                    <ProgressBar active label="Autoryzacja..." now={100} />
                </AppHeader>
            );
        }
        else if (!this.state.session["logged in"]) {
            result = (
                <AppHeader session={this.state.session}>
                    <LoginModal onLogin={this.fetchSession} fatalError={this.fatalErrorHandler} />
                </AppHeader>
            );
        }
        // return wrapped component
        else {
            result = <ComposedComponent {...this.props} {...this.state} fatalErrorHandler={this.fatalErrorHandler} />;
        }
        return result;
    }
}

class LoginModal extends Component {
    constructor(props) {
        super(props);

        this.login              = this.login.bind(this);
        this.handleChange       = this.handleChange.bind(this);
        this.handleKeyPress     = this.handleKeyPress.bind(this);
        this.getValidationState = this.getValidationState.bind(this);
        this.state = {
            login: "",
            password: "",
            msg: "Podaj login i hasło, aby się zalogować.",
        };
    }

    getValidationState(field) {
        let output = 'success';
        let fields = ["login", "password"];
        if (field !== undefined) {
            fields = [field];
        }
        for (let f of fields) {
            let len = this.state[f].length;
            if (len < 3 || len > 100) {
                output = 'error';
                break;
            }
        }
        return output;
    }

    handleChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }

    handleKeyPress(e, ev) {
        if (e.charCode === 13) {
            this.login();
        }
    }

    login() {
        if (this.getValidationState() !== 'success') {
            alert("Musisz podać poprawny login i hasło.");
            return;
        }
        utils.login(this.state.login, this.state.password, (resp) => function(self, resp){
            if (!resp["logged in"]) {
                self.setState({
                    login: "",
                    password: "",
                    msg: "Nieprawidłowy login lub hasło, spróbuj ponownie."
                });
            }
            else {
                self.props.onLogin();
            }
        }(this, resp), this.props.fatalError);
    }

    render() {
        return (
            <div className="static-modal">
                <Modal show>
                    <Modal.Header>
                        <Modal.Title>Formularz logowania</Modal.Title>
                        <p>{this.state.msg}</p>
                    </Modal.Header>

                    <Modal.Body>
                        <form>
                            <FormGroup controlId="login" validationState={this.getValidationState("login")}>
                                <ControlLabel>Login</ControlLabel>
                                <FormControl type="text" value={this.state.login} placeholder="Użytkownik" onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
                                <FormControl.Feedback />
                            </FormGroup>
                            <FormGroup controlId="password" validationState={this.getValidationState("password")}>
                                <ControlLabel>Hasło</ControlLabel>
                                <FormControl type="password" value={this.state.password} placeholder="Hasło" onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
                                <FormControl.Feedback />
                            </FormGroup>
                        </form>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.login}>Zaloguj</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default Session;