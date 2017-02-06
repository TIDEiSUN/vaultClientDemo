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

export default class ActivatePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUsername: '',
      newPassword: '',
      firstName: '',
      lastName: '',
      verified: false,
    };
    this.handleVerifyToken = this.handleVerifyToken.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
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

    // update blob
    const blob = CurrentLogin.loginInfo.blob;
    blob.data.firstName = this.state.firstName;
    blob.data.lastName = this.state.lastName;
    
    return VaultClientDemo.updateEmail(username, newUsername, newPassword, CurrentLogin.loginInfo, email)
      .then(result => {
        CurrentLogin.username = newUsername;
        CurrentLogin.password = newPassword;
        alert('Activated!');
      }).catch(err => {
        alert('Failed to activate account: ' + err.message);
        console.error('Failed to update email:', err);
        throw err;
      });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  render() {
    const queryString = this.props.location.query;
    if (this.state.verified) {
      return (
        <div className="home">
          <h1>Activate Account</h1>
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
