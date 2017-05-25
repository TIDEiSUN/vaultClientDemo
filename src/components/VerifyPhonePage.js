import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils } from '../logics';
import UnlockButton from './common/UnlockButton';

function PhoneInfoDiv(props) {
  if (!props.oldPhoneInfo) {
    return null;
  }

  const maskedPhone = Utils.maskphone(props.oldPhoneInfo.phoneNumber);

  return (
    <div>
      Phone number: {props.oldPhoneInfo.countryCode} {maskedPhone}
      [{props.verified?'Verified':'Not verified'}]
    </div>
  );
}

export default class VerifyPhonePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      countryCode: '',
      phoneNumber: '',
      token: '',
      oldPhoneInfo: null,
      verified: false,
      authToken: null,
      public: null,
      secret: null,
      hasPaymentPin: null,
      unlockSecret: null,
    };
    this.handleSubmitSend = this.handleSubmitSend.bind(this);
    this.handleSubmitVerify = this.handleSubmitVerify.bind(this);
    this.onUnlock = this.onUnlock.bind(this);
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          this.setState({
            loginInfo,
            oldPhoneInfo: blob.data.phone,
            verified: Utils.checkPhoneVerified(blob.account_level),
            public: blob.account_id,
            hasPaymentPin: blob.has_payment_pin,
            unlockSecret: blob.data.unlock_secret,
          });
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get login info');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  onUnlock(data) {
    const { secret, customKeys } = data;
    const newLoginInfo = VaultClient.cloneLoginInfo(this.state.loginInfo);
    newLoginInfo.customKeys = customKeys;
    this.setState({ secret, loginInfo: newLoginInfo });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmitSend(event) {
    console.log('Handle send verification code by sms');

    const oldPhoneNumber = this.state.oldPhoneInfo ? this.state.oldPhoneInfo.phoneNumber : null;
    const phoneNumber = this.state.phoneNumber ? this.state.phoneNumber : oldPhoneNumber;

    const oldCountryCode = this.state.oldPhoneInfo ? this.state.oldPhoneInfo.countryCode : null;
    const countryCode = this.state.countryCode ? this.state.countryCode : oldCountryCode;

    const phoneChanged = oldPhoneNumber !== phoneNumber || oldCountryCode !== countryCode;
    console.log(`old phone: (${oldCountryCode})${oldPhoneNumber}`);
    console.log(`new phone: (${countryCode})${phoneNumber}`);
    console.log(`phone changed: ${phoneChanged}`);

    if (phoneNumber && countryCode) {
      if (!phoneChanged && this.state.verified) {
        alert('Phone has been verified');
      } else {
        const phone = { countryCode, phoneNumber };
        VaultClient.authRequestUpdatePhone(this.state.loginInfo, phone)
          .then((result) => {
            console.log('request phone token', result);
            const { loginInfo, authToken } = result;
            this.setState({
              loginInfo,
              authToken,
            });
            alert('Success!');
          }).catch((err) => {
            console.error('Failed to send verification code by sms:', err);
            alert(`Failed to send verification code by sms: ${err.message}`);
          });
      }
    } else {
      alert('Missing country code / phone number');
    }
    event.preventDefault();
  }

  handleSubmitVerify(event) {
    console.log('Handle verify phone');
    const { countryCode, phoneNumber, token, authToken, hasPaymentPin } = this.state;
    const phone = {
      countryCode: this.state.countryCode,
      phoneNumber: this.state.phoneNumber,
    };

    if (phone.phoneNumber && phone.countryCode) {
      const newBlob = VaultClient.cloneBlob(this.state.loginInfo.blob);
      newBlob.data.phone = phone;
      VaultClient.authVerifyUpdatePhone(this.state.loginInfo, phone, token, authToken, newBlob, hasPaymentPin)
        .then((result) => {
          console.log('update phone:', result);
          const { blob } = result.loginInfo;
          this.setState({
            oldPhoneInfo: blob.data.phone,
            verified: Utils.checkPhoneVerified(blob.account_level),
          });
          alert('Success!');
        }).catch((err) => {
          console.error('Failed to verify phone:', err);
          alert(`Failed to verify phone: ${err.message}`);
        });
    } else {
      alert('Missing country code / phone number');
    }
    event.preventDefault();
  }

  render() {
    let updatePhoneForm;
    if (!this.state.hasPaymentPin || this.state.secret) {
      updatePhoneForm = (
        <div>
          <PhoneInfoDiv oldPhoneInfo={this.state.oldPhoneInfo} verified={this.state.verified} />
          <form onSubmit={this.handleSubmitSend}>
            <div>
              <label>
                Country code:
                <input type="text" value={this.state.countryCode} onChange={this.handleChange.bind(this, 'countryCode')} />
              </label>
              <label>
                Phone number:
                <input type="text" value={this.state.phoneNumber} onChange={this.handleChange.bind(this, 'phoneNumber')} />
              </label>
              <input type="submit" value="Send" />
            </div>
          </form>
          <form onSubmit={this.handleSubmitVerify}>
            <div>
              <label>
                Received token:
                <input type="text" value={this.state.token} onChange={this.handleChange.bind(this, 'token')} />
              </label>
              <input type="submit" value="Verify" />
            </div>
          </form>
        </div>
      );
    } else {
      updatePhoneForm = (
        <UnlockButton address={this.state.public} secret={this.state.secret} hasPaymentPin={this.state.hasPaymentPin} unlockSecret={this.state.unlockSecret} onUnlock={this.onUnlock} />
      );
    }
    return (
      <div className="home">
        <h1>Send Verification Code</h1>
        {updatePhoneForm}
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
