import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';

function PhoneInfoDiv(props) {
  if (props.oldPhoneInfo === null) {
    return null;
  }

  return (
    <div>
      Phone number: {props.oldPhoneInfo.country_code} {props.oldPhoneInfo.masked_phone}
      [{props.oldPhoneInfo.verified?'Verified':'Not verified'}]
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
    };
    this.handleSubmitSend = this.handleSubmitSend.bind(this);
    this.handleSubmitVerify = this.handleSubmitVerify.bind(this);

    this.getPhoneInfo();
  }

  getPhoneInfo() {
    // get phone info
    VaultClientDemo.get2FAInfo(CurrentLogin.loginInfo)
      .then((result) => {
        console.log(result);
        this.setState({
          oldPhoneInfo: result,
        });
      }).catch((err) => {
        console.error(err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmitSend(event) {
    console.log('Handle send verification code by sms');

    const oldPhoneNumber = this.state.oldPhoneInfo !== null ? this.state.oldPhoneInfo.phone : null;
    const phoneNumber = this.state.phoneNumber ? this.state.phoneNumber : oldPhoneNumber;

    const oldCountryCode = this.state.oldPhoneInfo !== null ? this.state.oldPhoneInfo.country_code : null;
    const countryCode = this.state.countryCode ? this.state.countryCode : oldCountryCode;

    if (phoneNumber && countryCode) {
      VaultClientDemo.sendPhoneVerificationCode(CurrentLogin.loginInfo, countryCode, phoneNumber)
        .then((result) => {
          console.log('request phone token', result);
          this.getPhoneInfo();
          alert('Success!');
        }).catch((err) => {
            alert(`Failed to send verification code by sms: ${err.message}`);
        });
    } else {
      alert('Missing country code / phone number');
    }
    event.preventDefault();
  }

  handleSubmitVerify(event) {
    console.log('Handle verify phone');
    VaultClientDemo.verifyPhone(CurrentLogin.loginInfo,
                                this.state.token)
      .then((result) => {
        console.log('verify phone token', result);
        this.getPhoneInfo();
        alert('Success!');
      }).catch((err) => {
        alert(`Failed to verify phone: ${err.message}`);
      });
    event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Send Verification Code</h1>
        <PhoneInfoDiv oldPhoneInfo={this.state.oldPhoneInfo} />
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
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
