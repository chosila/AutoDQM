import React, {Component} from 'react';
import * as api from '../api.js';
import Select from 'react-select';
import {css} from 'react-emotion';

export default class ApiSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      req: null,
      opts: [],
      err: null,
    };
  }

  componentWillMount = () => {
    this.loadOptions();
  };

  componentWillUnmount = () => {
    this.state.req && this.state.req.cancel();
  };

  componentDidUpdate = prevP => {
    const curP = this.props;
    if (
      prevP.type !== curP.type ||
      prevP.series !== curP.series ||
      prevP.sample !== curP.sample ||
      prevP.onError !== curP.onError ||
      prevP.onLoad !== curP.onLoad
    ) {
      this.state.req && this.state.req.cancel();
      this.setState({req: null, opts: [], err: null});
      this.loadOptions();
    }
  };

  loadOptions = () => {
    const {type, series, sample, onError, onLoad} = this.props;
    let req;
    if (type === 'get_runs' && series && sample) {
      req = api.getRuns(series, sample);
    } else if (type === 'get_samples' && series) {
      req = api.getSamples(series);
    } else if (type === 'get_series') {
      req = api.getSeries();
    } else if (type === 'get_subsystems') {
      req = api.getSubsystems();
    } else {
      return;
    }
    this.setState({req});

    req
      .then(res => {
        const seen = {};
        const opts = res.items
          .filter(r => !seen.hasOwnProperty(r.name) && (seen[r.name] = true))
          .map(r => ({value: r.name, label: r.name}))
          .sort((a, b) => a.label.localeCompare(b.label));
        onLoad && onLoad(opts);
        this.setState({opts, req: null});
      })
      .catch(err => {
        onError && onError(err);
        if (!(err.type === "cancel")) this.setState({req: null, err: err});
      });
  };

  render() {
    const {type, series, sample, onError, onLoad, ...selectProps} = this.props;
    return (
      <Select
        options={this.state.opts}
        isLoading={this.state.req}
        className={this.state.err && errSty}
        {...selectProps}
      />
    );
  }
}

const errSty = css`
  > div {
    border-color: rgb(220, 53, 69);
  }
`;
