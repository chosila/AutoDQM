import React, {Component} from 'react';
import {css} from 'react-emotion';
import {
  Card,
  CardTitle,
  CardText,
  Button,
  Container,
  Row,
  Col,
  Progress,
} from 'reactstrap';
import Controls from './Controls.js';
import Preview from './Preview.js';
import ReportInfo from './ReportInfo.js';
import Plots from './Plots.js';
import {Link} from 'react-router-dom';
import * as api from '../api.js';

const fullHeight = css`
  height: 100%;
  overflow-y: auto;
`;

export default class PlotsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plots: [],
      error: null,
      refReq: null,
      dataReq: null,
      procReq: null,
      search: '',
      showAll: false,
      hoveredPlot: null,
    };
  }

  componentWillMount = () => {
    this.update();
  }

  componentWillUnmount = () => {
    this.state.refReq && this.state.refReq.cancel();
    this.state.dataReq && this.state.dataReq.cancel();
    this.state.procReq && this.state.procReq.cancel();
  }
  
  componentDidUpdate = (prevProps) => {
    if(prevProps.match.url === this.props.match.url) return;
    this.update();
  };

  update = () => {
    let curMatch = this.props.match;
    if (!this.validParams(curMatch.params)) {
      this.setState({
        error: {message: 'Invalid report parameters!'},
      });
    } else {
      localStorage.setItem('recentQuery', JSON.stringify(curMatch.params));
      this.loadReport(curMatch.params);
    }
  }

  handleShowAllChange = checked => {
    this.setState({showAll: checked});
  };

  handleSearchChange = search => {
    this.setState({search});
  };

  handleHover = hoveredPlot => {
    this.setState({hoveredPlot});
  };

  loadReport = (query) => {
    const refReq = api.loadRun(query.refSeries, query.refSample, query.refRun);
    const dataReq = api.loadRun(query.dataSeries, query.dataSample, query.dataRun);
    this.setState({refReq, dataReq});
    
    refReq.then(res => {
      this.state.refReq && this.setState({refReq: null});
      return res;
    });
    dataReq.then(res => {
      this.state.dataReq && this.setState({refReq: null});
      this.setState({dataReq: null});
      return res;
    });

    Promise.all([refReq, dataReq])
      .then(res => {
        const procReq = api.generateReport(query);
        this.setState({refReq: null, dataReq: null, procReq});
        procReq
          .then(res => {
            const plots = res.items;
            this.setState({plots, procReq: null});
          })
          .catch(err => {
            if(err.type === 'cancel') return;
            this.setState({procReq: null, error: err});
          });
      })
      .catch(err => {
        if(err.type === 'cancel') return;
        this.setState({refReq: null, dataReq: null, error: err});
      });
  };

  validParams = (params) => {
    return (
      params.subsystem &&
      params.refSeries &&
      params.refSample &&
      params.refRun &&
      params.dataSeries &&
      params.dataSample &&
      params.dataRun
    );
  };

  render() {
    const {refReq, dataReq, procReq} = this.state;
    let body;
    if (this.state.error) {
      body = (
        <Card
          body
          outline
          color="danger"
          className="text-center mx-auto mt-3 col-lg-5">
          <CardTitle>Something went wrong...</CardTitle>
          <CardText>{this.state.error.message}</CardText>
          <Button color="primary" outline tag={Link} to="/">
            Return to input page.
          </Button>
        </Card>
      );
    } else if (refReq || dataReq || procReq) {
      body = <LoadingBox {...{refReq, dataReq, procReq}} />;
    } else {
      body = (
        <Plots
          plots={this.state.plots}
          search={this.state.search}
          showAll={this.state.showAll}
          onHover={this.handleHover}
        />
      );
    }
    
    return (
      <Container
        fluid
        className={css`
          flex-grow: 1;
          min-height: 0;
          height: 100%;
        `}>
        <Row
          className={css`
            padding: 0;
            height: 100%;
          `}>
          <Col
            md={4}
            xl={3}
            className={`${fullHeight} d-none d-md-block bg-light p-3`}>
            <Controls
              query={this.props.match.params}
              onShowAllChange={this.handleShowAllChange}
              onSearchChange={this.handleSearchChange}
              showAll={this.state.showAll}
              search={this.state.search}
              onHover={this.handleHover}
            />
            <Preview className="my-3" plot={this.state.hoveredPlot}/>
          </Col>
          <Col md={8} xl={9} className={fullHeight}>
            <ReportInfo
              {...this.props.match.params}
              timestamp={new Date().toUTCString()}
            />
            {body}
          </Col>
        </Row>
      </Container>
    );
  }
}

const LoadingBox = ({refReq, dataReq, procReq}) => {
  return (
    <Card body outline className="mx-auto mt-3 col-lg-5">
      <CardTitle className="text-center">Loading...</CardTitle>
      <Progress
        animated={refReq ? true : false}
        color={refReq ? 'info' : 'success'}
        value={100}
        className="mt-2">
        {refReq ? 'Reference loading...' : 'Reference loaded!'}
      </Progress>
      <Progress
        animated={dataReq ? true : false}
        color={dataReq ? 'info' : 'success'}
        value={100}
        className="mt-2">
        {dataReq ? 'Data loading...' : 'Data loaded!'}
      </Progress>
      <Progress
        animated={procReq ? true : false}
        color={procReq ? 'info' : refReq || dataReq ? 'secondary' : 'success'}
        value={100}
        className="mt-2">
        {procReq
          ? 'Processing...'
          : refReq || dataReq
            ? 'Waiting to process...'
            : 'Processed!'}
      </Progress>
    </Card>
  );
};
