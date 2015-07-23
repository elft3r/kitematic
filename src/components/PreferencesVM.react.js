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
import classNames from 'classnames';


var Preferences = React.createClass({
  mixins: [Router.Navigation],
  contextTypes: {
    router: React.PropTypes.func
  },
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
  handleClickVMSettings: function (index, event) {
    metrics.track('Opened VM Settings', {
      from: 'app'
    });
    this.context.router.transitionTo('preferencesVMSettings');
  },
  // handleChangeDockerEngine: function (machineIndex, e) {
  //   localStorage.setItem('settings.dockerEngine', machineIndex);
  //   if (this.state.currentEngine != machineIndex) {
  //     this.setState({
  //       currentEngine: machineIndex,
  //       engineChange: true
  //     });
  //     machine.updateName();
  //     SetupStore.setup().then(() => {
  //       docker.init();
  //       this.transitionTo('search');
  //     }).catch(err => {
  //       this.setState({
  //         engineChange: false
  //       });
  //       metrics.track('Setup New Docker Failed', {
  //         step: 'catch',
  //         message: err.message
  //       });
  //       throw err;
  //     });
  //
  //   }
  // },
  render: function () {
    let machineList = React.addons.createFragment(_.mapObject(this.state.machines, (machine, index) => {
      let menu=[];
      let machineDriver = utils.camelCase(machine.driver);
      let machineName = utils.camelCase(machine.name);
      let startStopToggle;
      if (machine.state !== "Running") {
        startStopToggle = (
          <div className="action">
            <div className="action-icon start" onClick={this.handleStartVM}><span className="icon icon-start"></span></div>
          </div>
        );
      } else {
        startStopToggle = (
          <div className="action">
            <div className="action-icon stop" onClick={this.handleStopVM}><span className="icon icon-stop"></span></div>
          </div>
        );
      }
      return (
        <tr>
          <td>{startStopToggle}</td>
          <td>{machine.name}</td>
          <td>{machine.state}</td>
          <td>{utils.camelCase(machine.driver)}</td>
          <td>{machine.url}</td>
          <td>Active</td>
          <td><span className="btn-sidebar btn-preferences" onClick={this.handleClickVMSettings.bind(this, index)}><span className="icon icon-preferences"></span></span></td>
        </tr>
      );
    }));
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
                <th>&nbsp;</th>
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
