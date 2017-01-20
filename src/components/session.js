import React, { Component } from 'react';
import AppHeader from './header';
import ErrorMsg from './error';
import utils from '../utils';


var Session = ComposedComponent => class extends Component {
    constructor(props) {
        super(props);

        this.fatalErrorHandler = this.fatalErrorHandler.bind(this);
        this.state = {
            errorStatus: null,
            session: { "user": null },
        };
    }

    fatalErrorHandler(error) {
        console.log("Debug", error);
        if (error instanceof Response) {
            error = "Nie można nawiązać połączenia z serwerem."
        }
        this.setState({errorStatus: error});
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => function(self, session){
            self.setState({
                session: session
            });
        }(this, session), this.fatalErrorHandler);
    }

    render() {
        let result = <ComposedComponent {...this.props} {...this.state} fatalErrorHandler={this.fatalErrorHandler} />;
        if (this.state.errorStatus) {
            result = (
                <AppHeader session={this.state.session}>
                    <ErrorMsg reason={this.state.errorStatus} />
                </AppHeader>
            );
        }
        return result;
    }
}

export default Session;