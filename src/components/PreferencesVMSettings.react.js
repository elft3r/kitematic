import _ from 'underscore';
import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import machine from '../utils/DockerMachineUtil';
import utils from '../utils/Util';

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      name: this.context.router.getCurrentParams().name,
      details: {}
    };
  },
  componentDidMount: function() {
    machine.details(this.state.name).then( details => {
      this.setState({
        details: details
      });
    });
  },
  render: function () {
    let details = _.map(this.state.details, (value, key) => {
      let info;
      if (typeof value === "object") {
        info = _.map(value, (v, k) => {
          return (
            <tr key={k}>
              <td>{utils.camelCase(k.replace('_',' '))}</td>
              <td>{utils.camelCase(v.toString())}</td>
            </tr>
          );
        });
        info = (<table className="table"><tbody>{info}</tbody></table>);
      } else {
        info = utils.camelCase(value.toString());
      }
      return (
        <tr key={key}>
          <td>{utils.camelCase(key)}</td>
          <td>{info}</td>
        </tr>
      );
    });
    return (
      <div className="details-panel">
        <div className="settings">
          <div className="settings-panel">
            <div className="settings-section">
              <h3>Machine settings for {this.state.name}</h3>
              <table className="table">
              <tbody>
                {details}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
