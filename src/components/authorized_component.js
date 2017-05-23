import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
 
var AuthorizedComponent = ComposedComponent => class extends Component {
    static propTypes = {
        routes: PropTypes.array.isRequired
    };

    static contextTypes = {
        router: PropTypes.object.isRequired
    };
 
    componentWillMount() {
        const { routes } = this.props; // array of routes
        const { router } = this.context;

        // check if user data available
        const user = this.props.session;
        if (!user || !user.role) {
            // redirect to login if role not available
            router.push('/');
        }
        for (let i = 0; i < routes.length; i++){
            let r = routes[i];
            if (r.authorize && r.authorize !== user.role) {
                router.push('/');
                break;
            }
        }
    }

    render() {
        return (<ComposedComponent {...this.props} {...this.state} />);
    }
}

export default AuthorizedComponent;