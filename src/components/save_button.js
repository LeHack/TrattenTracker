import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

import '../css/save_button.css';

export function SaveChanges(props) {
    let clickHandler   = props.saveHandler;
    let discardHandler = props.discardHandler;
    let text = "Gotowe";
    if (props.sending) {
        text = "Wysyłanie...";
    }
    if (props.disabled) {
        clickHandler = function() { this.blur(); };
    }
    else if (!props.sending) {
        text = "Wyślij zmiany";
    }
    return (
        <ButtonGroup bsClass="btn-group saveControls">
            <Button bsSize="sm" disabled={props.disabled} onClick={clickHandler}>{text}</Button>
            {!props.disabled &&
                <Button bsSize="sm" onClick={discardHandler}>Anuluj</Button>
            }
        </ButtonGroup>
    );
}
