import React, {Component} from 'react';
import {Container, Row, Col} from 'reactstrap';
import InputForm from './InputForm.js';
import RefSuggestions from './RefSuggestions.js';
import QueryListDisplay from './QueryListDisplay';

export default class InputPage extends Component {
  constructor(props) {
    super(props);
    let rq = props.recentQuery;
    /* eslint-disable eqeqeq */
    let refEqualsData =
      !rq ||
      (rq.dataSeries == rq.refSeries &&
        rq.dataSample == rq.refSample &&
        rq.dataRun == rq.refRun);
    /* eslint-enable eqeqeq */

    this.state = {
      refEqualsData,
      query: {
        subsystem: null,
        refSeries: null,
        refSample: null,
        refRun: null,
        dataSeries: null,
        dataSample: null,
        dataRun: null,
        ...props.recentQuery,
      },
    };
  }

  handleInputChange = c => {
    this.setState(prevState => {
      let refEqualsData = prevState.refEqualsData;
      if ('refSeries' in c || 'refSample' in c || 'refRun' in c)
        refEqualsData = false;

      if ('dataSeries' in c) c = {...c, dataSample: null, dataRun: null};
      else if ('dataSample' in c) c = {...c, dataRun: null};
      if ('refSeries' in c) c = {...c, refSample: null, refRun: null};
      else if ('refSample' in c) c = {...c, refRun: null};

      let query = {...prevState.query, ...c};
      //gotta make refList[current].query a thing. how to do that

      if (refEqualsData) {
        query.refSeries = query.dataSeries;
        query.refSample = query.dataSample;
        query.refRun = query.dataRun;
      }
      return {query, refEqualsData};
    });
  };

  handleSuggestionClick = ref => {
    this.setState(prevState => {
      let query = {
        ...prevState.query,
        refSeries: ref.series,
        refSample: ref.sample,
        refRun: ref.run,
      };
      return {query, refEqualsData: false};
    });
  };

  handleClearForm = () => {   
    this.setState({
      refEqualsData: true,
      query: {
        subsystem: null,
        refSeries: null,
        refSample: null,
        refRun: null,
        dataSeries: null,
        dataSample: null,
        dataRun: null,
      },
    });
  };

  handleAddQuery = (query) => {
    this.props.queryCallback(query);
  }

  render() {
    let query = this.state.query;
    return (
      <Container fluid>
        <Row>
          <Col md="6">
            <InputForm
              query={query}
              onChange={this.handleInputChange}
              onClearForm={this.handleClearForm}
            />
          </Col>
          <Col md="6">
            <RefSuggestions
              subsystem={query.subsystem}
              series={query.dataSeries}
              sample={query.dataSample}
              run={query.dataRun}
              onChange={this.handleSuggestionClick}
            />
          </Col>
        </Row>
        <Row>
          <Col>
          {/*
            <button onClick={() => this.handleAddQuery(query)}>
              add ref to list
            </button>
            <button onClick={this.props.clearQueryList}>
              clear ref list
            </button>
            {/* 
            why does the second one not work when i pass a function in
            is it because it's a function from the parent?
            */}
          </Col>
          <Col>
            < QueryListDisplay 
              query={this.state.query}
              queryList={this.props.recentQueryList}
              handleAddQuery = {() => this.props.queryCallback(query)}
              handleClearList = {this.props.clearQueryList}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}
/* why does handleAddQuery need () => and handleClearList doesn't. is it the fact
that queyrCallback has an argument?*/
