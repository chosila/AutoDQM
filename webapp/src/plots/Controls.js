import React, {Component} from 'react';
import {Card, CardBody, Input, Button, Col, Row} from 'reactstrap';
import Select from 'react-select';
import Switch from 'react-switch';
import {css} from 'react-emotion';

export default class Controls extends Component {
  handleSearchChange = e => {
    this.props.onSearchChange(e.target.value);
    e.preventDefault();
  };

  render() {
    return (
      <Card className={this.props.className}>
        <CardBody className="p-2">
          <div>
            <small className="text-muted">Filter plots</small>
            <Input
              onChange={this.handleSearchChange}
              value={this.props.search}
            />
          </div>
          <div className="mt-2">
            <small className="text-muted mt-3">
              Select a different data run
            </small>
            <Row>
              <Col xs="4">
                <Button
                  outline
                  color="primary"
                  className={css`
                    width: 100%;
                  `}>
                  Prev
                </Button>
              </Col>
              <Col xs="4" className="p-0">
                <Select />
              </Col>
              <Col xs="4">
                <Button
                  outline
                  color="primary"
                  className={css`
                    width: 100%;
                  `}>
                  Next
                </Button>
              </Col>
            </Row>
          </div>
          <div className="mt-3">
            <span>Show hidden plots</span>
            <Switch
              className={css`
                vertical-align: middle;
                margin-left: 4px;
                float: right;
              `}
              checked={this.props.showAll}
              onChange={this.props.onShowAllChange}
            />
          </div>
        </CardBody>
      </Card>
    );
  }
}
