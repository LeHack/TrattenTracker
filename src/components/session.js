import React, { Component } from 'react';
import utils from '../utils';


class Session extends Component {
    constructor() {
        super();
        this.state = {
            session: { "user": null },
        };
    }

    componentDidMount() {
        utils.fetchSessionStatus((session) => function(self, session){
            self.setState({
                session: session
            });
        }(this, session));
    }

    // Anything, to make React happy
    render() {
        return (<div></div>);
    }
}

export default Session;