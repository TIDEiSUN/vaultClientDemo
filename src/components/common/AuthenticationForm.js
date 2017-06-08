import React from 'react';
import { RadioGroup, Radio } from 'react-radio-group';
import AsyncButton from './AsyncButton';

const objHasOwnProp = Object.prototype.hasOwnProperty;

const specialParams = {
  blobId: {
    username: 'text',
    password: 'password',
  },
};

const twoFactorAuthOptions = [
  { label: 'Google Authenticator', value: 'google' },
  { label: 'SMS', value: 'sms' },
  { label: 'Authy', value: 'authy' },
];

const Stage = {
  CHOOSE_METHOD: 0,
  REQUEST_CODE: 1,
  VERIFY_CODE: 2,
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

function ParamInputs(props) {
  const { objName, params, onParamChange } = props;
  const inputs = Object.keys(params).map((key) => {
    const param = params[key];
    if (!param.type) {
      return (
        <div key={key}>{key}:{param.value}</div>
      );
    }
    const handleChange = onParamChange.bind(null, objName, key);
    return (
      <div key={key}>
        {key}:
        <input type={param.type} value={param.value} onChange={handleChange} />
      </div>
    );
  });
  return (<div>{inputs}</div>);
}

function ErrorText(props) {
  const { text } = props;
  if (!text) {
    return null;
  }
  const style = {
    color: 'red',
  };
  return (
    <div style={style}>
      <p>{text}</p>
      <br />
    </div>
  );
}

function InputForm(props) {
  const { title, params, self, objName } = props;
  if (!params) {
    return null;
  }

  const handleParamChange = self.handleParamChange.bind(self);
  return (
    <div>
      <h1>{title}</h1>
      <ParamInputs objName={objName} params={params} onParamChange={handleParamChange} />
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

function MethodOptionForm(props) {
  const { options, selected, handleOptionChange, handleSubmit, handleBack } = props;

  const radios = options.map((option) => {
    return (
      <div key={option.value}>
        <Radio value={option.value} />{option.label}
      </div>
    );
  });
  return (
    <form>
      <RadioGroup name="method" selectedValue={selected} onChange={handleOptionChange}>
        {radios}
      </RadioGroup>
      <button onClick={handleSubmit}>Next</button>
      <button onClick={handleBack}>Back</button>
    </form>
  );
}

function RequestForm(props) {
  const { handleSubmit } = props;
  return (
    <div>
      Request Token:
      <AsyncButton
        type="button"
        onClick={handleSubmit}
        pendingText="Requesting..."
        fulFilledText="Requested"
        rejectedText="Failed! Try Again"
        text="Request"
      />
    </div>
  );
}

function VerifyForm(props) {
  const { token, handleTokenChange, handleSubmit } = props;
  return (
    <div>
      <div>
        Token:
        <input type="text" name="token" value={token.value} onChange={handleTokenChange} />
      </div>
      <AsyncButton
        type="button"
        onClick={handleSubmit}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
      />
    </div>
  );
}

function TwoFactorAuthForm(props) {
  const { params, self } = props;
  const { twofa_stage } = self.state;
  if (twofa_stage === Stage.CHOOSE_METHOD) {
    const submitCallback = (event) => {
      event.preventDefault();
      self.setState((prevState) => {
        const via = prevState.params['2fa_via'].value;
        const stage = via === 'google' ? Stage.VERIFY_CODE : Stage.REQUEST_CODE;
        return {
          twofa_stage: stage,
        };
      });
    };
    const childProps = {
      options: twoFactorAuthOptions,
      selected: params['2fa_via'].value,
      handleOptionChange: self.handleOptionChange.bind(self, 'params', '2fa_via'),
      handleSubmit: submitCallback,
    };
    return <MethodOptionForm {...childProps} />;
  }
  if (twofa_stage === Stage.REQUEST_CODE) {
    const submitCallback = () => {
      return self.handleSubmit(params)
        .then(() => {
          self.setState({ twofa_stage: Stage.VERIFY_CODE });
        });
    };
    const childProps = {
      handleSubmit: submitCallback,
    };
    return <RequestForm {...childProps} />;
  }
  if (twofa_stage === Stage.VERIFY_CODE) {
    const submitCallback = () => {
      return self.handleSubmit(params)
        .then(() => {
          self.setState({ twofa_stage: Stage.CHOOSE_METHOD });
        });
    };
    const childProps = {
      token: params.token,
      handleTokenChange: self.handleParamChange.bind(self, 'params', 'token'),
      handleSubmit: submitCallback,
    };
    return <VerifyForm {...childProps} />;
  }
  return null;
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
        errorMessage: null,
        twofa_stage: Stage.CHOOSE_METHOD,
      };
    } else {
      this.state = {
        step: null,
        params: null,
        resendParams: null,
        cachedParamValues: defaultParams,
        errorMessage: null,
        twofa_stage: Stage.CHOOSE_METHOD,
      };
    }
  }

  componentDidMount() {
    this.props.initForm();
  }

  componentWillReceiveProps(props) {
    const { auth, systemParams = {}, errorMessage } = props;
    const { step, params, resendParams } = auth;
    if (step) {
      const { cachedParamValues } = this.state;
      const newParams = params ? setParams(cachedParamValues, systemParams, params) : null;
      const newResendParams = resendParams ? setParams(cachedParamValues, systemParams, resendParams) : null;
      this.setState({
        step,
        params: newParams,
        resendParams: newResendParams,
        errorMessage,
      });
    } else {
      this.setState({
        step,
        params: null,
        resendParams: null,
        errorMessage,
      });
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

  handleOptionChange(objName, name, value) {
    const params = this.state[objName];
    const param = params[name];
    const updatedParam = { ...param };
    updatedParam.value = value;
    const newParams = { ...params, [name]: updatedParam };
    this.setState({ [objName]: newParams });
  }

  handleSet2FAStage(stage, event) {
    event.preventDefault();
    this.setState({ twofa_stage: stage });
  }

  render() {
    if (!this.state.step || this.state.step === 'done') {
      return null;
    }
    if (this.state.step === 'twoFactorAuth') {
      return (
        <div>
          <h1>twoFactorAuth</h1>
          <TwoFactorAuthForm params={this.state.params} self={this} />
        </div>
      );
    }
    return (
      <div>
        <ErrorText text={this.state.errorMessage} />
        <InputForm title={this.state.step} params={this.state.params} self={this} objName="params" />
        <br />
        <InputForm title="Resend" params={this.state.resendParams} self={this} objName="resendParams" />
      </div>
    );
  }
}
