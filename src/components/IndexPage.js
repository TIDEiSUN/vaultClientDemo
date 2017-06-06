import React from 'react';
import { Link, browserHistory } from 'react-router';
import { VaultClient, Config, VCUtils as Utils } from '../logics';

function EmailField(props) {
  const { blob, self } = props;
  if (blob.pendingEmail) {
    return (
      <div>
        Email: {blob.email} [Verified]
        <br />
        Pending Email:
        <ResendVerificationButton target={self} />
      </div>
    );
  } else {
    return (
      <div>
        Email: {blob.email} [Verified]
      </div>
    );
  }
}

function LastBlobIDChangeDate(props) {
  const { date, timestamp } = props;
  if (!date) {
    return null;
  }
  return (
    <div>
      Blob ID: Last updated at {date} ({timestamp})
    </div>
  );
}

function LastSecretIDChangeDate(props) {
  const { time } = props;
  if (!time) {
    return null;
  }
  return (
    <div>
      Secret ID: Last updated at {time}
    </div>
  );
}

function IDPhotosStatus(props) {
  const { id_photos } = props;
  if (!id_photos) {
    return (
      <div>
        ID Photos: null
      </div>
    );
  }
  if (!id_photos.uploaded_date) {
    return (
      <div>
        ID Photos: {id_photos.status}
      </div>
    );
  }
  return (
    <div>
      ID Photos: {id_photos.status} (Last updated at {id_photos.uploaded_date})
    </div>
  );
}

function ResendVerificationButton(props) {
  const { target } = props;
  return (
    <form onSubmit={target.handleResendEmail}>
      <input type="text" value={target.state.resendEmail} onChange={target.handleChange.bind(target, 'resendEmail')} />
      <input type="submit" value="Resend verification" />
    </form>
  );
}

function LogoutButton(props) {
  const { target } = props;
  return (
    <button onClick={target.handleLogout}>Logout</button>
  );
}

export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resendEmail: null,
      lastBlobIDChangeDate: '',
      lastBlobIDChangeTimestamp: '',
      lastSecretIDChangeTime: '',
    };
    this.handleResendEmail = this.handleResendEmail.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    const setLoginInfo = (loginInfo) => {
      const { blob } = loginInfo;
      this.setState({
        loginInfo,
        resendEmail: blob.pendingEmail,
        lastBlobIDChangeDate: blob.last_id_change_date,
        lastBlobIDChangeTimestamp: blob.last_id_change_timestamp,
        lastSecretIDChangeTime: blob.last_secret_id_change_time,
      });
    };
    const promise = VaultClient.getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setLoginInfo)
      .catch((err) => {
        console.error('getLoginInfo', err);
        alert('Failed to get login info');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleResendEmail(event) {
    console.log('Resend verification email');

    const { loginInfo } = this.state;
    const oldEmail = loginInfo.blob.email ? loginInfo.blob.email : '';
    const newEmail = this.state.resendEmail ? this.state.resendEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged) {
      alert('Email has no change.');
    } else {
      VaultClient.authRequestUpdateEmail(loginInfo, newEmail, Config.changeEmailURL)
        .then((result) => {
          console.log('request update email', result);
          this.setState({ loginInfo: result.loginInfo });
          alert('Verification email has been sent to ' + newEmail);
        }).catch((err) => {
          console.error('Verication email cannot be sent:', err);
          alert('Verication email cannot be sent: ' + err.message);
        });
    }
    event.preventDefault();
  }

  handleLogout(event) {
    VaultClient.logoutAccount(this.state.loginInfo)
      .then((result) => {
        console.log('Logout account', result);
        browserHistory.push('/');
      })
      .catch((err) => {
        console.error('Failed to logout account', err.message);
      });
  }

  render() {
    if (!this.state.loginInfo) {
      return null;
    }
    const { loginInfo } = this.state;

    return (
      <div className="home">
        <div>Welcome {loginInfo.username}!</div>
        <LastBlobIDChangeDate date={this.state.lastBlobIDChangeDate} timestamp={this.state.lastBlobIDChangeTimestamp} />
        <LastSecretIDChangeDate time={this.state.lastSecretIDChangeTime} />
        <div>
          Ripple address: {loginInfo.blob.data.account_id}
        </div>
        <br />
        <EmailField blob={loginInfo.blob} self={this} />
        <br />
        <div>
          First Name: {loginInfo.blob.data.firstname}<br />
          Last Name: {loginInfo.blob.data.lastname}<br />
          Date of Birth: {loginInfo.blob.data.birth}<br />
          Country: {loginInfo.blob.data.country}
        </div>
        <br />
        <div>
          Account Level: {loginInfo.blob.account_level}
        </div>
        <IDPhotosStatus id_photos={loginInfo.blob.id_photos} />
        <br />
        <div>
          <Link to="/changepw">Change Password</Link>
          <br />
          <Link to="/changepaymentpin">Change Payment Pin</Link>
          <br />
          <Link to="/changepersonaldata">Change Personal Data</Link>
          <br />
          <Link to="/changeemail">Change Email</Link>
          <br />
          <Link to="/phone">Verify Phone</Link>
          <br />
          <Link to="/upload">Upload ID Photos</Link>
          <br />
          <Link to="/payment">Make Payment</Link>
          <br />
          <Link to="/exchange">Exchange Currency</Link>
          <br />
          <Link to="/wallet">Show Wallet</Link>
          <br />
          <Link to="/bankaccount">Show Bank Account</Link>
          <br />
          <Link to="/block">Block Account</Link>
          <br />
          <Link to="/2fa">Two Factor Authentication</Link>
        </div>
        <div>
          <LogoutButton target={this} />
        </div>
      </div>
    );
  }
}
