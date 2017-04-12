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

function getParamInputs(objName, params, self) {
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
        <input type={param.type} value={param.value} onChange={self.handleParamChange.bind(self, objName, key)} />
      </div>
    );
  });
  return paramInputs;
}

function InputForm(props) {
  const { title, params, self, objName } = props;
  if (!params) {
    return null;
  }
  const paramInputs = getParamInputs(objName, params, self);
  if (paramInputs.length === 0) {
    return null;
  }

  return (
    <div>
      <h1>{title}</h1>
      {paramInputs}
      <AsyncButton
        type="button"
        onClick={self.handleSubmit.bind(self, params)}
        pendingText="Wait..."
        fulFilledText="Submitted"
        rejectedText="Failed! Try Again"
        text="Submit"
      />
    </div>
  );
}

export default class AuthenticationForm extends React.Component {
  constructor(props) {
    super(props);
    const { auth, systemParams = {}, defaultParams = {} } = props;
    if (auth) {
      const { step, params, resendParams } = auth;
      const newParams = params ? setParams(defaultParams, systemParams, params) : null;
      const newResendParams = resendParams ? setParams(defaultParams, systemParams, resendParams) : null;
      this.state = {
        step,
        params: newParams,
        resendParams: newResendParams,
        cachedParamValues: defaultParams,
      };
    } else {
      this.state = {
        step: null,
        params: null,
        resendParams: null,
        cachedParamValues: defaultParams,
      };
    }
  }

  componentWillReceiveProps(props) {
    const { auth, systemParams = {} } = props;
    const { step, params, resendParams } = auth;
    if (step) {
      const { cachedParamValues } = this.state;
      const newParams = params ? setParams(cachedParamValues, systemParams, params) : null;
      const newResendParams = resendParams ? setParams(cachedParamValues, systemParams, resendParams) : null;
      this.setState({ step, params: newParams, resendParams: newResendParams });
    } else {
      this.setState({ step, params: null, resendParams: null });
    }
  }

  handleSubmit(params) {
    const { cachedParamValues } = this.state;
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

  handleParamChange(objName, name, event) {
    const params = this.state[objName];
    const param = params[name];
    const updatedParam = { ...param };
    updatedParam.value = event.target.value;
    const newParams = { ...params, [name]: updatedParam };
    this.setState({ [objName]: newParams });
  }

  render() {
    if (!this.state.step || this.state.step === 'done') {
      return null;
    }
    return (
      <div>
        <InputForm title={this.state.step} params={this.state.params} self={this} objName="params" />
        <br />
        <InputForm title="Resend" params={this.state.resendParams} self={this} objName="resendParams" />
      </div>
    );
  }
}
