import React, { Component } from 'react';
import utils from '../utils';


// TODO: Refactor as an ordinary component, not inheritance base
class Session extends Component {
    constructor(props) {
        super(props);
        this.state = {
            session: { "user": null },
            errorStatus: false,
        };
    }

    fatalErrorHandler(error) {
        console.log("Debug", error);
        this.setState({errorStatus: true});
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => function(self, session){
            self.setState({
                session: session
            });
        }(this, session), this.props.fatalError);
    }

    // Anything, to make React happy
    render() {
        return (<div></div>);
    }
}

export default Session;