import React from 'react';
import { Jumbotron } from 'react-bootstrap';
import '../css/error.css';


function ErrorMsg(props) {
    return (
        <Jumbotron bsClass="jumbotron error">
            <h3>Wystąpił błąd: {props.reason}</h3>
        </Jumbotron>
    );
}

export default ErrorMsg;