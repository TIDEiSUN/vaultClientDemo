import React from 'react';
import { Link } from 'react-router';
import { RadioGroup, Radio } from 'react-radio-group';
import { VaultClient, VCUtils as Utils } from '../logics';
import AsyncButton from './common/AsyncButton';

const twoFactorAuthOptions = [
  { label: 'Google Authenticator', value: 'gauth' },
  { label: 'SMS', value: 'sms' },
];

function PhoneInfoDiv(props) {
  if (!props.phone) {
    return null;
  }

  const maskedPhone = Utils.maskphone(props.phone.phoneNumber);

  return (
    <div>
      Phone number: {props.phone.countryCode} {maskedPhone}
      [{props.verified?'Verified':'Not verified'}]
      [{props.hasEnabled?'2FA enabled':'2FA disabled'}]
    </div>
  );
}

function ToggleButton(props) {
  const { phone, hasEnabled, self } = props;
  if (!phone) {
    return null;
  }
  const toggle = (event) => {
    event.preventDefault();
    self.setState({
      change2FA: true,
    });
  };
  return (
    <button onClick={toggle}>{hasEnabled ? 'Disable' : 'Enable'}</button>
  );
}

function EnableOptionForm(props) {
  const { options, self } = props;

  const submitForm = (event) => {
    event.preventDefault();
    self.setState({
      chosenOption: true,
    });
  };

  const radios = options.map((option) => {
    return (
      <div>
        <Radio value={option.value} />{option.label}
      </div>
    );
  });
  return (
    <form>
      <RadioGroup name="option" onChange={self.handleOptionChange}>
        {radios}
      </RadioGroup>
      <button onClick={submitForm}>Next</button>
    </form>
  );
}

function EnableGAuthForm(props) {
  const { self } = props;

  const backForm = (event) => {
    event.preventDefault();
    self.setState({
      chosenOption: false,
      option: null,
    });
  };

  const key = 'rrrkk llldd saser kls90';
  return (
    <div>
      <div>
        Step 1: Install Google Authenticator app from app store
      </div>
      <div>
        Step 2: Scan QR code or enter key
        {key}
      </div>
      <div>
        <input type="text" name="totp" value={self.state.totp} onChange={self.handleInputChange} />
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleEnableGAuth}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
      />
      <button onClick={backForm}>Back</button>
    </div>
  );
}

function EnableSmsRequestForm(props) {
  const { phone, self } = props;

  const backForm = (event) => {
    event.preventDefault();
    self.setState({
      chosenOption: false,
      option: null,
    });
  };

  const { phoneNumber, countryCode } = phone;

  const maskedPhone = Utils.maskphone(phoneNumber);

  return (
    <div>
      <p>We will send a verification code to +{countryCode} {maskedPhone}.</p>
      <p>Please check your SMS.</p>
      <AsyncButton
        type="button"
        onClick={self.handleEnableSmsRequest}
        pendingText="Submitting..."
        fulFilledText="Submitted"
        rejectedText="Failed! Try Again"
        text="Submit"
      />
      <button onClick={backForm}>Back</button>
    </div>
  );
}

function EnableSmsVerifyForm(props) {
  const { phone, self } = props;
  const { phoneNumber, countryCode } = phone;

  const maskedPhone = Utils.maskphone(phoneNumber);

  return (
    <div>
      <p>The verification code has been sent to +{countryCode} {maskedPhone}.</p>
      <input type="text" name="smsToken" onChange={self.handleInputChange} />
      <AsyncButton
        type="button"
        onClick={self.handleEnableSmsVerify}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
      />
    </div>
  );
}

function EnableSmsForm(props) {
  const { self } = props;
  if (self.state.requestedSms) {
    return <EnableSmsVerifyForm {...props} />;
  } else {
    return <EnableSmsRequestForm {...props} />;
  }
}

function DisableForm(props) {
  const { via, self } = props;
  return null;
}

export default class TwoFactorAuthPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: false,
      hasEnabled: false,
      phone: null,
      verified: false,
      option: null,
      change2FA: false,
      chosenOption: false,
      requestedSms: false,
      totp: '',
      smsToken: '',
    };
    this.handleSubmitSet = this.handleSubmitSet.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleEnableGAuth = this.handleEnableGAuth.bind(this);
    this.handleEnableSmsRequest = this.handleEnableSmsRequest.bind(this);
    this.handleEnableSmsVerify = this.handleEnableSmsVerify.bind(this);
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
          this.setState({
            hasEnabled: info.enabled,
            via: info['2fa_via'],
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

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  handleSubmitSet(event) {
    console.log('Handle set 2FA');

    const phone = this.state.phone;
    if (phone.phoneNumber && phone.countryCode) {
      VaultClient.set2FAInfo(this.state.loginInfo,
                                 this.state.enabled,
                                 phone)
        .then((result) => {
          console.log('set 2fa:', result);
          this.setState({
            hasEnabled: result.enabled,
          });
          alert('Success!');
        }).catch((err) => {
          console.error('Failed to set 2FA :', err);
          alert(`Failed to set 2FA: ${err.message}`);
        });
    }
    event.preventDefault();
  }

  handleOptionChange(value) {
    this.setState({ option: value });
  }

  handleInputChange(event) {
    const { target } = event;
    const { value, name } = target;
    this.setState({ [name]: value });
  }

  handleEnableGAuth() {
    this.setState({
      change2FA: false,
      hasEnabled: true,
      via: 'google',
      chosenOption: false,
    });
    return Promise.resolve();
  }

  handleEnableSmsRequest() {
    this.setState({ requestedSms: true });
    return Promise.resolve();
  }

  handleEnableSmsVerify() {
    this.setState({
      requestedSms: false,
      change2FA: false,
      hasEnabled: true,
      via: 'sms',
      chosenOption: false,
    });
    return Promise.resolve();
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      if (!this.state.change2FA) {
        childComponents = <ToggleButton phone={this.state.phone} hasEnabled={this.state.hasEnabled} self={this} />;
      } else if (this.state.hasEnabled) {
        childComponents = <DisableForm />;
      } else if (!this.state.chosenOption) {
        childComponents = <EnableOptionForm options={twoFactorAuthOptions} self={this} />;
      } else if (this.state.option === 'gauth') {
        childComponents = <EnableGAuthForm self={this} />;
      } else {
        childComponents = <EnableSmsForm phone={this.state.phone} self={this} />;
      }
    }
    return (
      <div className="home">
        <h1>Set 2FA Enable</h1>
        <PhoneInfoDiv phone={this.state.phone} verified={this.state.verified} hasEnabled={this.state.hasEnabled} />
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
