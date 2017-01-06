import React from 'react';
import { Router, Route, browserHistory } from 'react-router';

import Main from './views/mode_select';
import AttendanceSummary from './views/attendance_summary';
import NotFound from './views/not_found';
import cfg from './route_config';

module.exports = (
    <Router history={browserHistory}>
        <Route path='/' component={Main}/>
        <Route path={cfg.routes.attendance} component={NotFound}/>
        <Route path={cfg.routes.payment} component={NotFound}/>
        <Route path={cfg.routes.attendance_summary} component={AttendanceSummary}/>
        <Route path={cfg.routes.payment_summary} component={NotFound}/>
        <Route path='*' component={NotFound}/>
    </Router>
);