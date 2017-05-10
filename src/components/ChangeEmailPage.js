import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Config } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import LoginForm from './common/LoginForm';

function LoginDiv(props) {
  const { loggedIn, queryString, self } = props;
  const verify = Object.keys(queryString).length > 0;
  if (!verify) {
    return null;
  }

  const { username } = queryString;

  if (loggedIn) {
    return (
      <div>
        <li>Username: {username}</li>
      </div>
    );
  }

  return (
    <LoginForm username={username} loginCallback={self.handleLogin} />
  );
}

function UpdateEmailForm(props) {
  const { loggedIn, queryString, self } = props;
  const verify = Object.keys(queryString).length > 0;
  if (verify) {
    if (!loggedIn) {
      return null;
    }

    const {
      username,
      email,
      token,
      authToken,
    } = queryString;

    const disabled = !username || !email || !token || !authToken;

    return (
      <div>
        <li>Username: {username}</li>
        <li>Email: {email}</li>
        <li>Token: {token}</li>
        <AsyncButton
          type="button"
          onClick={self.handleVerifyToken}
          pendingText="Verifying..."
          fulFilledText="Verified"
          rejectedText="Failed! Try Again"
          text="Verify"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <form>
      <div>
        <label>
          New email:
          <input type="text" value={self.state.newEmail} onChange={self.handleChange.bind(self, 'newEmail')} />
        </label>
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmit}
        pendingText="Changing..."
        fulFilledText="Changed"
        rejectedText="Failed! Try Again"
        text="Change"
        />
    </form>
  );
}

export default class ChangeEmailPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: CurrentLogin && CurrentLogin.loginInfo,
      newEmail: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVerifyToken = this.handleVerifyToken.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleLogin(loginInfo) {
    CurrentLogin.loginInfo = loginInfo;
    console.log('Login sucessfully', loginInfo);
    this.setState({
      loggedIn: true,
    });
    return Promise.resolve();
  }

  handleVerifyToken() {
    console.log('Handle verify email');

    const {
      username,
      email,
      token,
      authToken,
    } = this.props.location.query;

    return VaultClient.authVerifyUpdateEmail(CurrentLogin.loginInfo, email, token, authToken)
      .then((result) => {
        console.log('verify update email', result);
        CurrentLogin.loginInfo = result.loginInfo;
        alert('OK!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('verify update email:', err);
        alert(`Failed! ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleSubmit() {
    console.log('Handle update email');

    const oldEmail = CurrentLogin.loginInfo.blob.email ? CurrentLogin.loginInfo.blob.email : '';
    const newEmail = this.state.newEmail ? this.state.newEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged) {
      alert('Email has no change.');
      return Promise.reject(new Error('Email has no change.'));
    } else {
      return VaultClient.authRequestUpdateEmail(CurrentLogin.loginInfo, newEmail, Config.changeEmailURL)
        .then((result) => {
          console.log('request update email', result);
          CurrentLogin.loginInfo = result.loginInfo;
          alert('Verification email has been sent to ' + newEmail);
          return Promise.resolve();
        }).catch((err) => {
          console.error('Verication email cannot be sent:', err);
          alert('Verication email cannot be sent: ' + err.message);
          return Promise.reject(err);
        });
    }
  }

  render() {
    let link = '/';
    let pageName = 'login';
    if (CurrentLogin.loginInfo) {
      link = '/main';
      pageName = 'main';
    }
    return (
      <div className="home">
        <h1>Change Email</h1>
        <LoginDiv loggedIn={this.state.loggedIn} queryString={this.props.location.query} self={this} />
        <UpdateEmailForm loggedIn={this.state.loggedIn} queryString={this.props.location.query} self={this} />
        <Link to={link}>Back to {pageName} page</Link>
      </div>
    );
  }
}
