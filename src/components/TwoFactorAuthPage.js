import React from 'react';
import { Link } from 'react-router';
import { RadioGroup, Radio } from 'react-radio-group';
import { VaultClient, VCUtils as Utils } from '../logics';
import AsyncButton from './common/AsyncButton';

const twoFactorAuthOptions = [
  { label: 'Google Authenticator', value: 'google' },
  { label: 'SMS', value: 'sms' },
  { label: 'Authy', value: 'authy' },
];

const Stage = {
  TOGGLE_2FA: 0,
  CHOOSE_METHOD: 1,
  REQUEST_CODE: 2,
  VERIFY_CODE: 3,
};

function PhoneInfoDiv(props) {
  const { phone, verified, hasEnabled } = props;
  if (!phone) {
    return null;
  }

  const { phoneNumber, countryCode } = phone;
  const maskedPhone = Utils.maskphone(phoneNumber);

  return (
    <div>
      Phone number: {countryCode} {maskedPhone}
      [{verified ? 'Verified' : 'Not verified'}]
      [{hasEnabled ? '2FA enabled' : '2FA disabled'}]
    </div>
  );
}

function ToggleButton(props) {
  const { phone, hasEnabled, handleSubmit } = props;
  if (!phone) {
    return null;
  }
  return (
    <div>
      <button onClick={handleSubmit}>{hasEnabled ? 'Disable' : 'Enable'}</button>
    </div>
  );
}

function MethodOptionForm(props) {
  const { options, selected, handleOptionChange, handleSubmit, handleBack } = props;

  const radios = options.map((option) => {
    return (
      <div>
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

function GAuthForm(props) {
  const { totp, gKey, showSetup, handleInputChange, handleGAuth, handleBack } = props;

  let setup = null;
  if (showSetup) {
    setup = (
      <div>
        <div>
          Step 1: Install Google Authenticator app from app store
        </div>
        <div>
          Step 2: Scan QR code or enter key
        </div>
        <div>
          {gKey}
        </div>
      </div>
    );
  }
  return (
    <div>
      {setup}
      <div>
        TOTP:
        <input type="text" name="totp" value={totp} onChange={handleInputChange} />
      </div>
      <AsyncButton
        type="button"
        onClick={handleGAuth}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
      />
      <button onClick={handleBack}>Back</button>
    </div>
  );
}

function SmsRequestForm(props) {
  const { phone, handleSmsRequest, handleBack } = props;

  const { phoneNumber, countryCode } = phone;

  const maskedPhone = Utils.maskphone(phoneNumber);

  return (
    <div>
      <p>We will send a verification code to +{countryCode} {maskedPhone}.</p>
      <p>Please check your SMS.</p>
      <AsyncButton
        type="button"
        onClick={handleSmsRequest}
        pendingText="Submitting..."
        fulFilledText="Submitted"
        rejectedText="Failed! Try Again"
        text="Submit"
      />
      <button onClick={handleBack}>Back</button>
    </div>
  );
}

function SmsVerifyForm(props) {
  const { phone, smsToken, handleInputChange, handleSmsVerify, handleBack } = props;
  const { phoneNumber, countryCode } = phone;

  const maskedPhone = Utils.maskphone(phoneNumber);

  return (
    <div>
      <p>The verification code has been sent to +{countryCode} {maskedPhone}.</p>
      <div>
        <input type="text" name="smsToken" value={smsToken} onChange={handleInputChange} />
      </div>
      <AsyncButton
        type="button"
        onClick={handleSmsVerify}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
      />
      <button onClick={handleBack}>Back</button>
    </div>
  );
}

function AuthyForm(props) {
  const { handleAuthy, handleBack } = props;
  return (
    <div>
      <AsyncButton
        type="button"
        onClick={handleAuthy}
        pendingText="Processing..."
        fulFilledText="Confirmed"
        rejectedText="Failed! Try Again"
        text="Confirm"
      />
      <button onClick={handleBack}>Back</button>
    </div>
  );
}

export default class TwoFactorAuthPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: false,
      hasEnabled: false,
      phone: null,
      verified: false,
      method: null,
      stage: Stage.TOGGLE_2FA,
      via: '',
      gKey: '',
      totp: '',
      smsToken: '',
      authToken: '',
    };
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleEnableGAuth = this.handleEnableGAuth.bind(this);
    this.handleEnableSmsRequest = this.handleEnableSmsRequest.bind(this);
    this.handleEnableSmsVerify = this.handleEnableSmsVerify.bind(this);
    this.handleEnableAuthy = this.handleSubmitSetAuthy.bind(this, true);
    this.handleDisableGAuth = this.handleDisableGAuth.bind(this);
    this.handleDisableSmsRequest = this.handleDisableSmsRequest.bind(this);
    this.handleDisableSmsVerify = this.handleDisableSmsVerify.bind(this);
    this.handleDisableAuthy = this.handleSubmitSetAuthy.bind(this, false);
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          this.setState({
            loginInfo,
            phone: blob.data.phone,
            verified: Utils.checkPhoneVerified(blob.account_level),
          });
          return loginInfo;
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get login info');
        });
    };
    const get2FAInfo = (loginInfo) => {
      return VaultClient.get2FAInfo(loginInfo)
        .then((info) => {
          console.log('2FA info', info);
          this.setState({
            hasEnabled: info.enabled,
            via: info.via,
          });
        })
        .catch((err) => {
          console.error('get2FAInfo', err);
          alert('Failed to get 2FA info');
        });
    };
    const promise = getLoginInfo()
      .then(loginInfo => get2FAInfo(loginInfo));
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentDidUpdate(prevProps, prevState) {
    const { stage, hasEnabled, method, via } = this.state;
    if (stage === Stage.CHOOSE_METHOD) {
      if (hasEnabled && via !== 'google') {
        this.setState({
          stage: Stage.REQUEST_CODE,
          method: via,
        });
      }
    } else if (stage === Stage.REQUEST_CODE) {
      if (method === 'authy') {
        this.setState({
          stage: Stage.VERIFY_CODE,
        });
      } else if (method === 'google') {
        this.setState({
          stage: Stage.VERIFY_CODE,
          gKey: Utils.generateGAuthSecret(),
        });
      }
    }
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  handleSubmitSetAuthy(enable) {
    console.log('Handle set 2FA authy');

    const { phone, loginInfo } = this.state;

    if (!phone) {
      return Promise.reject(new Error('Phone not set'));
    }
    return VaultClient.set2FAInfo(loginInfo, enable, phone)
      .then((result) => {
        console.log('set 2fa:', result);
        this.setState({
          stage: Stage.TOGGLE_2FA,
          hasEnabled: result.enabled,
          via: 'authy',
        });
        alert('Success!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('Failed to set 2FA :', err);
        alert(`Failed to set 2FA: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleOptionChange(value) {
    this.setState({ method: value });
  }

  handleInputChange(event) {
    const { target } = event;
    const { value, name } = target;
    this.setState({ [name]: value });
  }

  handleEnableGAuth() {
    const { loginInfo, gKey, totp } = this.state;
    return VaultClient.enable2FAGoogle(loginInfo, gKey, totp)
      .then((result) => {
        console.log('enable 2fa google:', result);
        this.setState({
          stage: Stage.TOGGLE_2FA,
          hasEnabled: true,
          via: 'google',
        });
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to enable 2fa google:', err);
        alert(`Failed to enable 2FA: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleEnableSmsRequest() {
    const { loginInfo, phone } = this.state;
    return VaultClient.enable2FASmsRequest(loginInfo, phone)
      .then((result) => {
        console.log('enable 2fa google request:', result);
        const { authToken } = result;
        this.setState({
          stage: Stage.VERIFY_CODE,
          authToken,
        });
        alert('Requested!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to enable 2fa sms request:', err);
        alert(`Failed to request sms token: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleEnableSmsVerify() {
    const { loginInfo, phone, smsToken, authToken } = this.state;
    return VaultClient.enable2FASms(loginInfo, phone, smsToken, authToken)
      .then((result) => {
        console.log('enable 2fa google:', result);
        this.setState({
          stage: Stage.TOGGLE_2FA,
          hasEnabled: true,
          via: 'sms',
        });
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to enable 2fa sms:', err);
        alert(`Failed to enable 2fa sms: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleDisableGAuth() {
    const { loginInfo, totp } = this.state;
    return VaultClient.disable2FAGoogle(loginInfo, totp)
      .then((result) => {
        console.log('disable 2fa google:', result);
        this.setState({
          stage: Stage.TOGGLE_2FA,
          hasEnabled: false,
          via: 'disable',
        });
        alert('Success!');
        return Promise.resolve();        
      })
      .catch((err) => {
        console.error('Failed to disable 2fa google:', err);
        alert(`Failed to disable 2FA: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleDisableSmsRequest() {
    const { loginInfo, phone } = this.state;
    return VaultClient.disable2FASmsRequest(loginInfo, phone)
      .then((result) => {
        console.log('enable 2fa google request:', result);
        const { authToken } = result;
        this.setState({
          stage: Stage.VERIFY_CODE,
          authToken,
        });
        alert('Requested!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to disable 2fa sms request:', err);
        alert(`Failed to request sms token: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleDisableSmsVerify() {
    const { loginInfo, phone, smsToken, authToken } = this.state;
    return VaultClient.disable2FASms(loginInfo, phone, smsToken, authToken)
      .then((result) => {
        console.log('disable 2fa google:', result);
        this.setState({
          stage: Stage.TOGGLE_2FA,
          hasEnabled: false,
          via: 'disable',
        });
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to disable 2fa sms:', err);
        alert(`Failed to disable 2fa sms: ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleSetStage(stage, event) {
    event.preventDefault();
    this.setState({ stage });
  }

  renderForm() {
    const { stage, hasEnabled, method, phone } = this.state;
    if (stage === Stage.TOGGLE_2FA) {
      const childProps = {
        phone,
        hasEnabled,
        handleSubmit: this.handleSetStage.bind(this, Stage.CHOOSE_METHOD),
      };
      return <ToggleButton {...childProps} />;
    }
    if (stage === Stage.CHOOSE_METHOD) {
      const submitCallback = (event) => {
        event.preventDefault();
        if (!this.state.method) {
          alert('Choose one of the methods');
          return;
        }
        this.setState({ stage: Stage.REQUEST_CODE });
      };
      const childProps = {
        options: twoFactorAuthOptions,
        selected: method,
        handleOptionChange: this.handleOptionChange,
        handleBack: this.handleSetStage.bind(this, Stage.TOGGLE_2FA),
        handleSubmit: submitCallback,
      };
      return <MethodOptionForm {...childProps} />;
    }
    if (method === 'google') {
      if (stage === Stage.REQUEST_CODE) {
        return null;
      }
      const { gKey, totp } = this.state;
      const childProps = {
        gKey,
        totp,
        handleInputChange: this.handleInputChange,
        showSetup: !hasEnabled,
        handleGAuth: hasEnabled ? this.handleDisableGAuth : this.handleEnableGAuth,
        handleBack: this.handleSetStage.bind(this, Stage.CHOOSE_METHOD),
      };
      return <GAuthForm {...childProps} />;
    }
    if (method === 'sms') {
      if (stage === Stage.REQUEST_CODE) {
        const backStage = hasEnabled ? Stage.TOGGLE_2FA : Stage.CHOOSE_METHOD;
        const childProps = {
          phone,
          handleSmsRequest: hasEnabled ? this.handleDisableSmsRequest : this.handleEnableSmsRequest,
          handleBack: this.handleSetStage.bind(this, backStage),
        };
        return <SmsRequestForm {...childProps} />;
      }
      const { smsToken } = this.state;
      const childProps = {
        phone,
        smsToken,
        handleInputChange: this.handleInputChange,
        handleSmsVerify: hasEnabled ? this.handleDisableSmsVerify : this.handleEnableSmsVerify,
        handleBack: this.handleSetStage.bind(this, Stage.REQUEST_CODE),
      };
      return <SmsVerifyForm {...childProps} />;
    }
    if (method === 'authy') {
      if (stage === Stage.REQUEST_CODE) {
        return null;
      }
      const backStage = hasEnabled ? Stage.TOGGLE_2FA : Stage.CHOOSE_METHOD;
      const childProps = {
        handleAuthy: hasEnabled ? this.handleDisableAuthy : this.handleEnableAuthy,
        handleBack: this.handleSetStage.bind(this, backStage),
      };
      return <AuthyForm {...childProps} />;
    }
    return null;
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = this.renderForm();
    }
    return (
      <div className="home">
        <h1>Set 2FA Enable</h1>
        <PhoneInfoDiv phone={this.state.phone} verified={this.state.verified} hasEnabled={this.state.hasEnabled} />
        <br />
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
