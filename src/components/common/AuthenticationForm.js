import React from 'react';
import AsyncButton from './AsyncButton';

const objHasOwnProp = Object.prototype.hasOwnProperty;

function setParams(allInputParams, systemParams, params) {
  const newParams = { ...params };
  Object.keys(params).forEach((key) => {
    if (objHasOwnProp.call(systemParams, key)) {
      newParams[key] = systemParams[key];
    } else if (objHasOwnProp.call(allInputParams, key)) {
      newParams[key] = allInputParams[key];
    }
  });
  return newParams;
}

export default class AuthenticationForm extends React.Component {
  constructor(props) {
    super(props);
    const { auth, systemParams } = props;
    const { step, params } = auth;
    const newParams = setParams({}, systemParams, params);
    this.state = {
      step,
      params: newParams,
      allInputParams: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(props) {
    const { auth, systemParams } = props;
    const { step, params } = auth;
    if (step) {
      const { allInputParams } = this.state;
      const newParams = setParams(allInputParams, systemParams, params);
      this.setState({ step, params: newParams });
    } else {
      this.setState({ step, params });
    }
  }

  handleSubmit() {
    const { params, allInputParams } = this.state;
    const updatedAllInputParams = {
      ...allInputParams,
      ...params,
    };
    this.setState({ allInputParams: updatedAllInputParams });
    return this.props.submitForm(this.state.params);
  }

  handleParamChange(name, event) {
    const { params } = this.state;
    const newParams = { ...params };
    newParams[name] = event.target.value;
    this.setState({ params: newParams });
  }

  render() {
    if (!this.state.step) {
      return null;
    }
    const { params } = this.state;
    const { systemParams } = this.props;
    const paramInputs = Object.keys(params).map((key) => {
      if (objHasOwnProp.call(systemParams, key)) {
        return (
          <div>{key}:{params[key]}</div>
        );
      }
      return (
        <div>
          {key}:
          <input type="text" value={params[key]} onChange={this.handleParamChange.bind(this, key)} />
        </div>
      );
    });
    return (
      <div>
        <h1>{this.state.step}</h1>
        {paramInputs}
        <AsyncButton
          type="button"
          onClick={this.handleSubmit}
          pendingText="Wait..."
          fulFilledText="Submitted"
          rejectedText="Failed! Try Again"
          text="Submit"
        />
      </div>
    );
  }
}
