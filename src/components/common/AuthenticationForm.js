import React from 'react';
import AsyncButton from './AsyncButton';

const objHasOwnProp = Object.prototype.hasOwnProperty;

const specialParams = {
  blobId: {
    username: 'text',
    password: 'password',
  },
};

function getParamValue(cachedParamValues, key) {
  if (objHasOwnProp.call(cachedParamValues, key)) {
    return cachedParamValues[key];
  }
  return undefined;
}

function setParams(cachedParamValues, systemParams, params) {
  const newParams = {};
  Object.keys(params).forEach((key) => {
    if (objHasOwnProp.call(systemParams, key)) {
      newParams[key] = {
        type: null,
        value: systemParams[key],
      };
    } else if (objHasOwnProp.call(specialParams, key)) {
      newParams[key] = {
        type: null,
        value: getParamValue(cachedParamValues, key) || params[key],
      };
      Object.keys(specialParams[key]).forEach((realKey) => {
        newParams[realKey] = {
          type: specialParams[key][realKey],
          value: getParamValue(cachedParamValues, realKey) || '',
        };
      });
    } else {
      newParams[key] = {
        type: 'text',
        value: getParamValue(cachedParamValues, key) || params[key],
      };
    }
  });
  return newParams;
}

function getParamInputs(params, self) {
  const paramInputs = Object.keys(params).map((key) => {
    const param = params[key];
    if (!param.type) {
      return (
        <div>{key}:{param.value}</div>
      );
    }
    return (
      <div>
        {key}:
        <input type={param.type} value={param.value} onChange={self.handleParamChange.bind(self, key)} />
      </div>
    );
  });
  return paramInputs;
}

export default class AuthenticationForm extends React.Component {
  constructor(props) {
    super(props);
    const { auth, systemParams = {} } = props;
    const { step, params } = auth;
    const newParams = setParams({}, systemParams, params);
    this.state = {
      step,
      params: newParams,
      cachedParamValues: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(props) {
    const { auth, systemParams = {} } = props;
    const { step, params } = auth;
    if (step) {
      const { cachedParamValues } = this.state;
      const newParams = setParams(cachedParamValues, systemParams, params);
      this.setState({ step, params: newParams });
    } else {
      this.setState({ step, params });
    }
  }

  handleSubmit() {
    const { params, cachedParamValues } = this.state;
    const outParams = {};
    Object.keys(params).forEach((key) => {
      outParams[key] = params[key].value;
    });
    const updatedCachedParamValues = {
      ...cachedParamValues,
      ...outParams,
    };
    this.setState({ cachedParamValues: updatedCachedParamValues });
    return this.props.submitForm(outParams);
  }

  handleParamChange(name, event) {
    const { params } = this.state;
    const param = params[name];
    const updatedParam = { ...param };
    updatedParam.value = event.target.value;
    const newParams = { ...params, [name]: updatedParam };
    this.setState({ params: newParams });
  }

  render() {
    if (!this.state.step) {
      return null;
    }
    const { params } = this.state;
    const paramInputs = getParamInputs(params, this);
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
