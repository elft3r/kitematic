import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import _ from 'underscore';
import classNames from 'classnames';


var Preferences = React.createClass({
  mixins: [Router.Navigation],
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      metricsEnabled: metrics.enabled()
    };
  },
  handleGoBackClick: function () {
    this.goBack();
    metrics.track('Went Back From Preferences');
  },
  render: function () {
    var currentRoutes = _.map(this.context.router.getCurrentRoutes(), r => r.name);
    var currentRoute = _.last(currentRoutes);
    var tabPreferenceClasses = classNames({
      'details-tab': true,
      'active': currentRoute === 'preferencesGeneral'
    });
    var tabVirtualboxClasses = classNames({
      'details-tab': true,
      'active': currentRoutes && (currentRoutes.indexOf('preferencesVirtualbox') >= 0)
    });
    var tabDigitaloceanClasses = classNames({
      'details-tab': true,
      'active': currentRoutes && (currentRoutes.indexOf('preferencesDigitalocean') >= 0)
    });

    return (
      <div className="details">
        <div className="details-subheader">
          <div className="details-header-actions">
            <div className="go-back">
              <a onClick={this.handleGoBackClick}>
              <span className="btn btn-new btn-action has-icon btn-hollow">Go Back</span>
              </a>
            </div>
          </div>
          <div className="details-subheader-tabs">
              <span className={tabPreferenceClasses}>
                <Router.Link to="preferencesGeneral">
                  Preferences
                </Router.Link>
              </span>
              <span className={tabVirtualboxClasses}>
                <Router.Link to="preferencesVirtualbox">
                VirtualBox
                </Router.Link>
              </span>
              <span className={tabDigitaloceanClasses}>
                <Router.Link to="preferencesDigitalocean">
                Digital Ocean
                </Router.Link>
              </span>
          </div>
        </div>
        <Router.RouteHandler {...this.props}/>
      </div>
    );
  }
});

module.exports = Preferences;
