import React, {Component} from 'react';
import {Container, Row, Col, Table, Button} from 'reactstrap';



export default class DisplayQueryList extends Component {
  /* maybe i don't need a state. input form doens't have a state
  inputForm doens't have a state bc all its function handling is a prop from InputPage
  there does not need to be a state here. App.js has a state and that is enough
  */ 


  handleRemoveQuery = () => {

  }

  queryItem = (item) => { 
    //key=item.refSeries+item.refSample+item.refRun;
    return (
      <tr >
        <td>{item.refSeries}</td>
        <td>{item.refSample}</td>
        <td>{item.refRun}</td>
        <td><Button onClick={() => this.handleRemoveQuery}>remove</Button></td>
      </tr>
    )
  }

  render(){
    let queryList = this.props.queryList;
    let query = this.props.query;
    return(
      <Container>
        <Row>
          <Button 
            onClick={this.props.handleAddQuery}
            disabled={(query.refRun==null)||(query.dataRun==null)}
          > 
            add ref 
          </Button>
          <Button onClick={this.props.handleClearList}> clear refs</Button>
        </Row>
        <Row>
          <Col md="3">
            <Table>
              <tbody>
                {queryList.map((item) => this.queryItem(item))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    )
  }
}

