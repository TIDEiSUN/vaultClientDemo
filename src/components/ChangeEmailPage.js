import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Config, VCUtils as Utils } from '../logics';
import AsyncButton from './common/AsyncButton';

function VerifyEmailForm(props) {
  const { queryString, self } = props;
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

function UpdateEmailForm(props) {
  const { self } = props;
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
      loggedIn: false,
      newEmail: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVerifyToken = this.handleVerifyToken.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  componentDidMount() {
    const queryString = this.props.location.query;
    const verify = Object.keys(queryString).length > 0;
    if (verify) {
      return;
    }
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          this.setState({ loginInfo, loggedIn: true });
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get tidepay address');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    if (this.cancelablePromise) {
      this.cancelablePromise.cancel();
    }
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleLogin(loginInfo) {
    console.log('Login sucessfully', loginInfo);
    this.setState({
      loginInfo,
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

    return VaultClient.authVerifyAndUpdateEmail(username, email, token, authToken)
      .then((result) => {
        console.log('verify update email', result);
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

    const { loginInfo } = this.state;
    const oldEmail = loginInfo.blob.email ? loginInfo.blob.email : '';
    const newEmail = this.state.newEmail ? this.state.newEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged) {
      alert('Email has no change.');
      return Promise.reject(new Error('Email has no change.'));
    } else {
      return VaultClient.authRequestUpdateEmail(loginInfo, newEmail, Config.changeEmailURL)
        .then((result) => {
          console.log('request update email', result);
          this.setState({ loginInfo: result.loginInfo });
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
    const queryString = this.props.location.query;
    const verify = Object.keys(queryString).length > 0;
    let link = '/main';
    let pageName = 'main';
    let form = (
      <UpdateEmailForm self={this} />
    );
    if (verify) {
      link = '/';
      pageName = 'login';
      form = (
        <VerifyEmailForm queryString={queryString} self={this} />
      );
    }
    return (
      <div className="home">
        <h1>Change Email</h1>
        {form}
        <Link to={link}>Back to {pageName} page</Link>
      </div>
    );
  }
}
