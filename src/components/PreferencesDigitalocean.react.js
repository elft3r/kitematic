import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';


var Preferences = React.createClass({
  mixins: [Router.Navigation],
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return null;
  },
  render: function () {

    return (
      <div className="details-panel">
        <div className="settings">
          <div className="settings-panel">
            <div className="settings-section">
             <i>Coming Soon</i>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
