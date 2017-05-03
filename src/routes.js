import React from 'react';
import { IndexRoute, Router, Route, browserHistory } from 'react-router';

import Main from './views/main';
import AdminView from './views/admin_view';
import UserSummary from './views/user_summary';
import AttendanceSummary from './views/attendance_summary';
import Attendance from './views/attendance_input';
import Payments from './views/payments_input';
import NotFound from './views/not_found';
import cfg from './route_config';

module.exports = (
    <Router history={browserHistory}>
        <Route name="Start" path="/">
            <IndexRoute component={Main} />
            <Route name="Zestawienie" path={cfg.routes.user_summary} component={UserSummary}/>
            <Route name="Prowadzący" path={cfg.routes.admin}>
                <IndexRoute component={AdminView} />
                <Route name="Obecności" path={cfg.routes.attendance} component={Attendance}/>
                <Route name="Płatności" path={cfg.routes.payment} component={Payments}/>
                <Route name="Zestawienie Obecności" path={cfg.routes.attendance_summary} component={AttendanceSummary}/>
                <Route name="Zestawienie Płatności" path={cfg.routes.payment_summary} component={NotFound}/>
            </Route>
		</Route>
        <Route name="404" path='*' component={NotFound}/>
    </Router>
);
