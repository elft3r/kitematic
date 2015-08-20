import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import Radial from './Radial.react';
import _ from 'underscore';
import utils from '../utils/Util';
import docker from '../utils/DockerUtil';
import SetupStore from '../stores/SetupStore';
import machine from '../utils/DockerMachineUtil';
import classNames from 'classnames';


var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
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
  updateMachine: function(name) {
    let machines = _.clone(this.state.machines);
    machine.state(name).then(info => {
        machines[name].state = info;
        console.log("VM: %o", info);
        this.setState({
          machines: machines
        })
    });
  },
  handleNewVM: function (event) {
    metrics.track('New VM', {
      from: 'VM Preferences'
    });
    this.transitionTo('preferencesVMNew');
  },
  handleClickVMSettings: function (vmName, event) {
    metrics.track('Opened VM Settings', {
      from: 'VM Preferences'
    });
    this.transitionTo('preferencesVMSettings', {name: vmName});
  },
  handleStartVM: function(vmName, event) {
    metrics.track('Started VM', {
      from: 'VM Preferences'
    });
    machine.start(vmName).then(status => {
        console.log("status: %o", status);
        this.updateMachine(vmName);
    });

  },
  handleStopVM: function(vmName, event) {
    metrics.track('Stopped VM', {
      from: 'VM Preferences'
    });
    machine.stop(vmName).then(status => {
        console.log("status: %o", status);
        this.updateMachine(vmName);
    });
  },
  handleChangeDockerEngine: function (machineIndex, e) {
    localStorage.setItem('settings.dockerEngine', machineIndex);
    if (this.state.currentEngine != machineIndex) {
      this.setState({
        currentEngine: machineIndex,
        engineChange: true
      });
      machine.updateName(machineIndex);
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
    let machineList = _.map(this.state.machines, (m, index) => {
      let menu=[];
      let machineDriver = utils.camelCase(m.driver);
      let machineName = utils.camelCase(m.name);
      let startStopToggle;
      if (m.state !== "Running") {
        startStopToggle = (
          <div className="action">
            <div className="action-icon start" onClick={this.handleStartVM.bind(this, index)}><span className="icon icon-start"></span></div>
          </div>
        );
      } else {
        startStopToggle = (
          <div className="action">
            <div className="action-icon stop" onClick={this.handleStopVM.bind(this, index)}><span className="icon icon-stop"></span></div>
          </div>
        );
      }
	  // change the machine
      let activateMachine;
      if (machine.name() !== m.name) {
        activateMachine = (
          <div className="active">
            <a onClick={this.handleChangeDockerEngine.bind(this, index)}>
              <span className="btn btn-new btn-action has-icon btn-hollow">SELECT</span>
            </a>
          </div>
        );
      } else {
        activateMachine = (
          <div className="action">
            <div className="action-icon stop" onClick={this.handleChangeDockerEngine.bind(this, index)}>ACTIVE</div>
          </div>
        );
      }
      return (
        <tr key={m.name}>
          <td>{startStopToggle}</td>
          <td>{m.name}</td>
          <td>{m.state}</td>
          <td>{utils.camelCase(m.driver)}</td>
          <td>{m.url}</td>
          <td>{activateMachine}</td>
          <td><span className="btn-sidebar btn-preferences" onClick={this.handleClickVMSettings.bind(this, index)}><span className="icon icon-preferences"></span></span></td>
        </tr>
      );
    });
    let body = (
        <div className="settings-section">
          <div className="title">Machines</div>
          <div className="create">
            <a onClick={this.handleNewVM}>
              <span className="btn btn-new btn-action has-icon btn-hollow">New</span>
            </a>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>&nbsp;</th>
                <th>Name</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Url</th>
                <th>Status</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {machineList}
            </tbody>
          </table>
        </div>
      );

    return (
      <div className="details-panel">
        <div className="settings virtual-machines">
          <div className="settings-panel">
              {body}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
