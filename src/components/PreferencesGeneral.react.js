import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import Radial from './Radial.react';

var PreferencesGeneral = React.createClass({
  mixins: [Router.Navigation],
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
    };
  },
  handleChangeCloseVMOnQuit: function (e) {
    var checked = e.target.checked;
    this.setState({
      closeVMOnQuit: checked
    });
    localStorage.setItem('settings.closeVMOnQuit', checked);
    metrics.track('Toggled Close VM On Quit', {
      close: checked
    });
  },
  handleChangeMetricsEnabled: function (e) {
    var checked = e.target.checked;
    this.setState({
      metricsEnabled: checked
    });
    metrics.setEnabled(checked);
    metrics.track('Toggled util/MetricsUtil', {
      enabled: checked
    });
  },
  render: function () {
    return (
      <div className="details-panel preferences">
        <div className="settings">
          <div className="settings-panel">
            <div className="settings-section">
              <div className="title">VM Settings</div>
              <div className="option">
                <div className="option-name">
                  Shut Down Linux VM on closing Kitematic
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.closeVMOnQuit} onChange={this.handleChangeCloseVMOnQuit}/>
                </div>
              </div>
              <div className="title">App Settings</div>
              <div className="option">
                <div className="option-name">
                  Report anonymous usage analytics
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.metricsEnabled} onChange={this.handleChangeMetricsEnabled}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = PreferencesGeneral;
