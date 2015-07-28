import _ from 'underscore';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
import util from './Util';
import resources from './ResourcesUtil';

var NAME = 'docker-vm';

var DockerMachine = {
  command: function () {
    return resources.dockerMachine();
  },
  name: function () {
    return NAME;
  },
  isoversion: function () {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.docker', 'machine', 'machines', NAME, 'boot2docker.iso'), 'utf8');
      var match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
      if (match) {
        return match[1];
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  },
  list: function () {
    return util.exec([this.command(), 'ls']).then(stdout => {
      var lines = stdout.trim().split('\n').filter(line => line.indexOf('time=') === -1);
      var machines = {};
      lines.slice(1, lines.length).forEach(line => {
        var tokens = line.trim().split(/[\s]+/).filter(token => token !== '*');
        var machine = {
          name: tokens[0],
          driver: tokens[1],
          state: tokens[2],
          url: tokens[3] || ''
        };
        machines[machine.name] = machine;
      });
      return Promise.resolve(machines);
    });
  },
  details: function(machine = this.name()) {
    return util.exec([this.command(), 'inspect', machine]).then(stdout => {
      stdout = JSON.parse(stdout);
      let details = {
        driver: stdout.DriverName,
        swarm: {
          master: stdout.Driver.SwarmMaster,
          host: stdout.Driver.SwarmHost,
          discovery: stdout.Driver.SwarmDiscovery
        }
      }
      let ip = this.ip(machine);
      let state = this.state(machine);
      let disk = this.disk(machine);
      let memory = this.memory(machine);
      return Promise.all([ip, state, disk, memory]).spread((ip, state, disk, memory) => {
        details.ip = ip;
        details.state = state;
        details.disk = disk;
        details.memory = memory;
        return Promise.resolve(details);
      });
    });
  },
  info: function (machine = this.name()) {
    return this.list().then(machines => {
      if (machines[machine]) {
        return Promise.resolve(machines[machine]);
      } else {
        return Promise.reject(new Error('Machine does not exist.'));
      }
    });
  },
  exists: function () {
    return this.info().then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  },
  create: function (machine = this.name()) {
    return util.exec([this.command(), '-D', 'create', '-d', 'virtualbox', '--virtualbox-memory', '2048', machine]);
  },
  start: function (machine = this.name()) {
    return util.exec([this.command(), '-D', 'start', machine]);
  },
  stop: function (machine = this.name()) {
    return util.exec([this.command(), 'stop', machine]);
  },
  upgrade: function (machine = this.name()) {
    return util.exec([this.command(), 'upgrade', machine]);
  },
  rm: function (machine = this.name()) {
    return util.exec([this.command(), 'rm', '-f', machine]);
  },
  ip: function (machine = this.name()) {
    return util.exec([this.command(), 'ip', machine]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  updateName: function () {
    NAME = localStorage.getItem('settings.dockerEngine') || (util.isWindows () ? 'kitematic' : 'dev');
  },
  regenerateCerts: function (machine = this.name()) {
    return util.exec([this.command(), 'tls-regenerate-certs', '-f', machine]);
  },
  state: function (machine = this.name()) {
    return this.info(machine).then(info => {
      return info ? info.state : null;
    });
  },
  driver: function () {
    return this.info().then(info => {
      return info ? info.driver : null;
    });
  },
  disk: function (machine = this.name()) {
    return util.exec([this.command(), 'ssh', machine, 'df']).then(stdout => {
      try {
        var lines = stdout.split('\n');
        var dataline = _.find(lines, function (line) {
          return line.indexOf('/dev/sda1') !== -1;
        });
        var tokens = dataline.split(' ');
        tokens = tokens.filter(function (token) {
          return token !== '';
        });
        var usedGb = parseInt(tokens[2], 10) / 1000000;
        var totalGb = parseInt(tokens[3], 10) / 1000000;
        var percent = parseInt(tokens[4].replace('%', ''), 10);
        return {
          used_gb: usedGb.toFixed(2),
          total_gb: totalGb.toFixed(2),
          percent: percent
        };
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  memory: function (machine = this.name()) {
    return util.exec([this.command(), 'ssh', machine, 'free -m']).then(stdout => {
      try {
        var lines = stdout.split('\n');
        var dataline = _.find(lines, function (line) {
          return line.indexOf('-/+ buffers') !== -1;
        });
        var tokens = dataline.split(' ');
        tokens = tokens.filter(function(token) {
          return token !== '';
        });
        var usedGb = parseInt(tokens[2], 10) / 1000;
        var freeGb = parseInt(tokens[3], 10) / 1000;
        var totalGb = usedGb + freeGb;
        var percent = Math.round(usedGb / totalGb * 100);
        return {
          used_gb: usedGb.toFixed(2),
          total_gb: totalGb.toFixed(2),
          free_gb: freeGb.toFixed(2),
          percent: percent
        };
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  stats: function (machine = this.name()) {
    this.state(machine).then(state => {
      if (state === 'Stopped') {
        return Promise.resolve({state: state});
      }
      var memory = this.memory(machine);
      var disk = this.disk(machine);
      return Promise.all([memory, disk]).spread((memory, disk) => {
        return Promise.resolve({
          memory: memory,
          disk: disk
        });
      });
    });
  },
  dockerTerminal: function (cmd) {
    if(util.isWindows()) {
      cmd = cmd || '';
      this.info().then(machine => {
        util.exec('start powershell.exe ' + cmd,
          {env: {
            'DOCKER_HOST' : machine.url,
            'DOCKER_CERT_PATH' : path.join(util.home(), '.docker/machine/machines/' + machine.name),
            'DOCKER_TLS_VERIFY': 1
          }
        });
      });
    } else {
      cmd = cmd || process.env.SHELL;
      this.info().then(machine => {
        util.exec([resources.terminal(), `DOCKER_HOST=${machine.url} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machine.name)} DOCKER_TLS_VERIFY=1 ${cmd}`]).then(() => {});
      });
    }
  },
};

module.exports = DockerMachine;
