import React, {Component} from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink as RouterNavLink,
} from 'react-router-dom';
import {Nav, NavItem, NavLink} from 'reactstrap';
import InputPage from './input/InputPage.js';
import PlotsPage from './plots/PlotsPage.js';
import * as api from './api.js';

class App extends Component {
  constructor(props) {
    super(props);
    const recentQueryString = localStorage.getItem('recentQuery');
    const recentQuery = recentQueryString && JSON.parse(recentQueryString);
    this.state = {
      recentQuery: recentQuery,
      recentQueryList: [],
    };
  }

  
  handleNewQuery = query => {
    localStorage.setItem('recentQuery', JSON.stringify(query));
    this.setState({recentQuery: query});
  };



  handleAddQuery = query => {
    let recentQueryList = this.state.recentQueryList;

    if (recentQueryList.length == 0 ){
      this.setState({
        recentQueryList: recentQueryList.concat([query]),
      });
    } else if (queryInList(recentQueryList, query)){ 
      console.log("this query is already in the list");
    } else{
      let sameData = (
        recentQueryList[0].subsystem == query.subsystem &&
        recentQueryList[0].dataSeries == query.dataSeries &&
        recentQueryList[0].dataSample == query.dataSample &&
        recentQueryList[0].dataRun == query.dataRun
        );
      if(sameData){
        this.setState({
          recentQueryList: recentQueryList.concat([query]),
        });
      } 
      else {
        console.log("the same data set is required");
      }
    }
  }



  handleClearQueryList = () => { 
    console.log("cleared list");
    this.setState({
      recentQueryList: [],
    });
  }

  render() {
    const plotsUrl = this.state.recentQuery
      ? api.queryUrl(this.state.recentQuery)
      : '';
    return (
      <Router>
        <React.Fragment>
          <Nav tabs>
            <NavItem>
              <NavLink
                tag={RouterNavLink}
                exact={true}
                to="/"
                activeClassName="active">
                AutoDQM
              </NavLink>
            </NavItem>
            <NavItem>
              {plotsUrl && (
                <NavLink
                  tag={RouterNavLink}
                  to={plotsUrl}
                  activeClassName="active">
                  Plots
                </NavLink>
              )}
            </NavItem>
          </Nav>
          <Switch>
            <Route
              exact
              path="/"
              render={props => (
                <InputPage 
                  recentQuery={this.state.recentQuery} 
                  queryCallback={this.handleAddQuery}
                  clearQueryList={this.handleClearQueryList}
                  recentQueryList={this.state.recentQueryList}
                  {...props} 
                />
              )}
            />
            <Route
              path="/plots/:subsystem/:refSeries/:refSample/:refRun/:dataSeries/:dataSample/:dataRun"
              render={props => (
                <PlotsPage 
                  onNewQuery={this.handleNewQuery} 
                  recentQueryList={this.state.recentQueryList}
                  {...props} 
                />
              )}
            />
            <Route path="/plots" component={PlotsPage} />
          </Switch>
        </React.Fragment>
      </Router>

    );
  }
}

function queryInList(queryList, newQuery){ 
  //checks if the new query is already in the list to avoid double count
  let inList = false;
  let i = 0; 
  while(inList == false && i < queryList.length){
    inList = (JSON.stringify(queryList[i]) == JSON.stringify(newQuery));
    i += 1; 
  }
  return inList;
}

export default App;
