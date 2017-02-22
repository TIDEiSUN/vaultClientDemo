import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';

function VerifyButton(props) {
  const disabled = !props.token || !props.email;

  return (
    <div>
      <li>Token: {props.token}</li>
      <li>Email: {props.email}</li>
      <AsyncButton
        type="button"
        onClick={props.target.handleVerifyToken}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
        disabled={disabled}
      />
    </div>
  );
}

function ActivateAccountForm(props) {
  const self = props.self;
  return (
    <form>
      <div>
        <label>
          Username: 
          <input type="text" value={self.state.newUsername} onChange={self.handleChange.bind(self, 'newUsername')} />
        </label>
        <label>
          Password: 
          <input type="password" value={self.state.newPassword} onChange={self.handleChange.bind(self, 'newPassword')} />
        </label>
        <label>
          First Name: 
          <input type="text" value={self.state.firstName} onChange={self.handleChange.bind(self, 'firstName')} />
        </label>
        <label>
          Last Name: 
          <input type="text" value={self.state.lastName} onChange={self.handleChange.bind(self, 'lastName')} />
        </label>
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmitForm}
        pendingText="Activating..."
        fulFilledText="Activated"
        rejectedText="Failed! Try Again"
        text="Activate"
      />
    </form>
  );
}

function VerifyPhoneForm(props) {
  const self = props.self;
  return (
    <div>
      <form onSubmit={self.handleSubmitPhone}>
        <div>
          <label>
            Country code:
            <input type="text" value={self.state.countryCode} onChange={self.handleChange.bind(self, 'countryCode')} />
          </label>
          <label>
            Phone number:
            <input type="text" value={self.state.phoneNumber} onChange={self.handleChange.bind(self, 'phoneNumber')} />
          </label>
          <input type="submit" value="Request" />
        </div>
      </form>
      <form onSubmit={self.handleSubmitVerifyPhone}>
        <div>
          <label>
            Received token:
            <input type="text" value={self.state.phoneToken} onChange={self.handleChange.bind(self, 'phoneToken')} />
          </label>
          <input type="submit" value="Verify" />
        </div>
      </form>
    </div>
  );
}

export default class ActivatePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUsername: '',
      newPassword: '',
      firstName: '',
      lastName: '',
      countryCode: '',
      phoneNumber: '',
      phoneToken: '',
      verified: false,
      phoneVerified: false,
    };
    this.handleVerifyToken = this.handleVerifyToken.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleSubmitPhone = this.handleSubmitPhone.bind(this);
    this.handleSubmitVerifyPhone = this.handleSubmitVerifyPhone.bind(this);
  }

  handleVerifyToken() {
    const queryString = this.props.location.query;
    const email = queryString.email;
    const token = queryString.token;
    const username = email;
    const password = '';
    return VaultClientDemo.loginAccount(username, password)
      .then((result) => {
        CurrentLogin.username = result.username;
        CurrentLogin.password = password;
        CurrentLogin.loginInfo = result;
        console.log('Login sucessfully', result);
        return VaultClientDemo.verifyEmailToken(username, token, email);
      }).then(result => {
        this.setState({
          verified: true,
        });
        alert('Verified!');
      }).catch(err => {
        console.error('Failed to verify token:', err);
        alert('Failed to verify token: ' + err.message);
        throw err;
      });
  }

  handleSubmitForm() {
    const queryString = this.props.location.query;
    const email = queryString.email;
    const username = email;
    const newUsername = this.state.newUsername;
    const newPassword = this.state.newPassword;
    let phone = null;
    if (this.state.phoneVerified) {
      phone = {
        phoneNumber: this.state.phoneNumber,
        countryCode: this.state.countryCode,
      };
    }

    // update blob
    const blob = CurrentLogin.loginInfo.blob;
    blob.data.firstName = this.state.firstName;
    blob.data.lastName = this.state.lastName;
    
    return VaultClientDemo.activateAccount(username, newUsername, newPassword, CurrentLogin.loginInfo, email, phone)
      .then((result) => {
        console.log('activate account:', result);
        CurrentLogin.username = newUsername;
        CurrentLogin.password = newPassword;
        CurrentLogin.loginInfo = result.loginInfo;
        alert('Activated!');
      }).catch(err => {
        console.error('Failed to activate account:', err);
        alert('Failed to activate account: ' + err.message);
        throw err;
      });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmitPhone(event) {
    console.log('Handle send verification code by sms');

    const phoneNumber = this.state.phoneNumber;
    const countryCode = this.state.countryCode;

    const phoneChanged = true;
    console.log(`new phone: (${countryCode})${phoneNumber}`);
    console.log(`phone changed: ${phoneChanged}`);

    if (phoneNumber && countryCode) {
      VaultClientDemo.sendPhoneVerificationCode(CurrentLogin.loginInfo,
                                                countryCode,
                                                phoneNumber,
                                                CurrentLogin.username)
        .then((result) => {
          console.log('request phone token', result);
          CurrentLogin.loginInfo = result.loginInfo;
          alert('Success!');
        }).catch((err) => {
          console.error('Failed to send verification code by sms:', err);
          alert(`Failed to send verification code by sms: ${err.message}`);
        });
    } else {
      alert('Missing country code / phone number');
    }
    event.preventDefault();
  }

  handleSubmitVerifyPhone(event) {
    console.log('Handle verify phone');
    const phone = {
      countryCode: this.state.countryCode,
      phoneNumber: this.state.phoneNumber,
    };

    if (phone.phoneNumber && phone.countryCode) {
      VaultClientDemo.verifyPhone(this.state.phoneToken,
                                  CurrentLogin.username,
                                  phone)
        .then((result) => {
          console.log('verify phone token:', result);
          this.setState({
            phoneVerified: true,
          });
          alert('Verified phone!');
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
    const queryString = this.props.location.query;
    if (this.state.verified) {
      return (
        <div className="home">
          <h1>Activate Account</h1>
          <VerifyPhoneForm self={this} />
          <ActivateAccountForm self={this} />
          <Link to="/">Back to login page</Link>
        </div>
      );
    } else {
      return (
        <div className="home">
          <h1>Activate Account</h1>
          <VerifyButton token={queryString.token} email={queryString.email} target={this} />
          <Link to="/">Back to login page</Link>
        </div>
      );      
    }
  }
}
