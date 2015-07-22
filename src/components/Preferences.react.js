import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import Radial from './Radial.react';
import _ from 'underscore';
import utils from '../utils/Util';
import docker from '../utils/DockerUtil';
import SetupStore from '../stores/SetupStore';
import containerStore from '../stores/ContainerStore';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import machine from '../utils/DockerMachineUtil';


var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      currentEngine: localStorage.getItem('settings.dockerEngine') || 'Kitematic',
      machines: {},
      engineChange: false
    };
  },
  componentDidMount: function () {
    machine.list().then( machines => {
      this.setState({
        machines: machines
      });
    });
  },
  handleGoBackClick: function () {
    this.goBack();
    metrics.track('Went Back From Preferences');
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
  onSelectAlert: function (eventKey, href, target) {
    alert('Alert from menu item.\neventKey: "' + eventKey + '"\nhref: "' + href + '"');
  },
  handleChangeDockerEngine: function (machineIndex, e) {
    localStorage.setItem('settings.dockerEngine', machineIndex);
    if (this.state.currentEngine != machineIndex) {
      this.setState({
        currentEngine: machineIndex,
        engineChange: true
      });
      machine.updateName();
      SetupStore.setup().then(() => {
        docker.init();
        this.transitionTo('search');
      }).catch(err => {
        this.setState({
          engineChange: false
        });
        metrics.track('Setup New Docker Failed', {
          step: 'catch',
          message: err.message
        });
        throw err;
      });

    }
  },
  render: function () {
    let currentDriver = '';
    let machineDropdown = (<div className="spinner la-ball-clip-rotate la-dark la-lg"><div></div></div>);
    if ( ! _.isEmpty(this.state.machines) ) {
      machineDropdown = React.addons.createFragment(_.mapObject(this.state.machines, (machine, index) => {
        let menu=[];
        let machineDriver = utils.camelCase(machine.driver);
        let machineName = utils.camelCase(machine.name);
        if (currentDriver != machine.driver) {
          menu.push(<MenuItem header>{machineDriver}</MenuItem>);
          currentDriver = machine.driver;
        }
        menu.push(<MenuItem onSelect={this.handleChangeDockerEngine.bind(this, index)} key={index}>{machineName}</MenuItem>);
        return menu;
      }));
    }
    let body;
    if (this.state.engineChange) {
      body = (
        <div className="details-progress">
          <h2>Updating Docker Engine</h2>
          <Radial spin="true" progress="90" thick={true} transparent={true}/>
        </div>
      );
    } else {
      body = (
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
            <div className="title">Docker Engine Settings</div>
            <div className="option">
              <div className="option-name">
                Select Docker Engine of choice
              </div>
              <div className="option-value clearfix">
                <DropdownButton bsStyle="primary" title={this.state.currentEngine}>
                  {machineDropdown}
                </DropdownButton>
              </div>
            </div>
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
      );
    }

    return (
      <div className="preferences">
          {body}
      </div>
    );
  }
});

module.exports = Preferences;
