import React from 'react';
import { IndexRoute, Router, Route, browserHistory } from 'react-router';

import App from './App';
import Main from './views/main';
import AttendanceSummary from './views/attendance_summary';
import Attendance from './views/attendance';
import NotFound from './views/not_found';
import cfg from './route_config';

module.exports = (
    <Router history={browserHistory}>
        <Route name="Start" path="/" component={App}>
            <IndexRoute component={Main} />
            <Route name="Obecności" path={cfg.routes.attendance} component={Attendance}/>
            <Route name="Płatności" path={cfg.routes.payment} component={NotFound}/>
            <Route name="Zestawienie Obecności" path={cfg.routes.attendance_summary} component={AttendanceSummary}/>
            <Route name="Zestawienie Płatności" path={cfg.routes.payment_summary} component={NotFound}/>
            <Route name="404" path='*' component={NotFound}/>
		</Route>
    </Router>
);
