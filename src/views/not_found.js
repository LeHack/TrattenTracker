import React, { Component } from 'react';

class NotFound extends Component {
    render() {
        return (
            <div className="jumbotron">
                <p>
                    <b>404</b>: Nothing to see here, move along!
                    <br/>
                    <a href='/'>Return to safety.</a>
                </p>
            </div>
        );
    }
};

export default NotFound;
