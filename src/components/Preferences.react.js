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
  showPreferences: function () {
    metrics.track('Viewed Preferences');
    this.context.router.transitionTo('preferencesGeneral', {name: this.context.router.getCurrentParams().name});
  },
  showVMPreferences: function () {
    metrics.track('Viewed VM Preferences');
    this.context.router.transitionTo('preferencesVM', {name: this.context.router.getCurrentParams().name});
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
      'active': currentRoutes && (currentRoutes.indexOf('preferencesVM') >= 0)
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
              <span className={tabPreferenceClasses} onClick={this.showPreferences}>App Preferences</span>
              <span className={tabVirtualboxClasses} onClick={this.showVMPreferences}>VM Preferences</span>
          </div>
        </div>
        <Router.RouteHandler {...this.props}/>
      </div>
    );
  }
});

module.exports = Preferences;
