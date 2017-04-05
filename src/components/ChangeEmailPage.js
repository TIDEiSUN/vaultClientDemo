import React from 'react';
import { Link } from 'react-router';
import { VaultClientDemo, Config } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';

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
    <form>
      <div>Username: {username}</div>
      <div>
        Password:
        <input type="password" value={self.state.password} onChange={self.handleChange.bind(self, 'password')} />
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleLogin}
        pendingText="Logging in..."
        fulFilledText="Logged in"
        rejectedText="Failed! Try Again"
        text="Login"
      />
    </form>
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
      operationId,
    } = queryString;

    const disabled = !username || !email || !token || !operationId;

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

  handleLogin() {
    return VaultClientDemo.loginAccount(this.props.location.query.username, this.state.password)
      .then((result) => {
        CurrentLogin.loginInfo = result;
        console.log('Login sucessfully', result);
        this.setState({
          loggedIn: true,
        });
      }).catch((err) => {
        alert('Failed to login: ' + err.message);
        throw Promise.reject(err);
      });
  }

  handleVerifyToken() {
    console.log('Handle verify email');

    const {
      username,
      email,
      token,
      operationId,
    } = this.props.location.query;

    const data = {
      operationId,
      params: {
        email,
        emailToken: token,
      },
    };
    return VaultClientDemo.authVerifyUpdateEmail(CurrentLogin.loginInfo, data)
      .then((result) => {
        console.log('verify update email', result);
        CurrentLogin.loginInfo = result.loginInfo;
        alert('OK!');
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
      const data = {
        operationId: null,
        params: {
          email: newEmail,
          hostlink: Config.changeEmailURL,
        },
      };
      return VaultClientDemo.authRequestUpdateEmail(CurrentLogin.loginInfo, data)
        .then((result) => {
          console.log('request update email', result);
          CurrentLogin.loginInfo = result.loginInfo;
          alert('Verification email has been sent to ' + newEmail);
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
