import React from 'react';
import { Link, browserHistory } from 'react-router';
import { CurrentLogin } from './Data';
import { VaultClientDemo, Config } from '../logics';

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
  if (!props.date) {
    return null;
  }
  return (
    <div>
      Blob ID: Last updated at {props.date}
    </div>
  );
}

function IDPhotosStatus(props) {
  if (!props.id_photos) {
    return (
      <div>
        ID Photos: null
      </div>
    );
  }
  if (!props.id_photos.uploaded_date) {
    return (
      <div>
        ID Photos: {props.id_photos.status}
      </div>
    );
  }
  return (
    <div>
      ID Photos: {props.id_photos.status} (Last updated at {props.id_photos.uploaded_date})
    </div>
  );
}

function ResendVerificationButton(props) {
  return (
    <form onSubmit={props.target.handleResendEmail}>
      <input type="text" value={props.target.state.resendEmail} onChange={props.target.handleChange.bind(props.target, 'resendEmail')} />
      <input type="submit" value="Resend verification" />
    </form>
  );
}

function LogoutButton(props) {
  return (
    <button onClick={props.target.handleLogout}>Logout</button>
  );
}

export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resendEmail: CurrentLogin.loginInfo.blob.pendingEmail || '',
      lastBlobIDChangeDate: CurrentLogin.loginInfo.blob.last_id_change_date,
    };
    this.handleResendEmail = this.handleResendEmail.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  // componentDidMount() {
  //   const { loginToken } = CurrentLogin;
  //   VaultClientDemo.getBlob(loginToken)
  //     .then((result) => {
  //       const { blob, loginToken: newLoginToken } = result;
  //       console.log('@@blob', blob);
  //       console.log('@@old token', loginToken);
  //       console.log('@@new token', newLoginToken);
  //     })
  //     .catch((err) => {
  //       console.error('Failed to get blob', err);
  //     });
  // }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleResendEmail(event) {
    console.log('Resend verification email');

    const oldEmail = CurrentLogin.loginInfo.blob.email ? CurrentLogin.loginInfo.blob.email : '';
    const newEmail = this.state.resendEmail ? this.state.resendEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged) {
      alert('Email has no change.');
    } else {
      VaultClientDemo.authRequestUpdateEmail(CurrentLogin.loginInfo, newEmail, Config.changeEmailURL)
        .then((result) => {
          console.log('request update email', result);
          CurrentLogin.loginInfo = result.loginInfo;
          alert('Verification email has been sent to ' + newEmail);
        }).catch((err) => {
          console.error('Verication email cannot be sent:', err);
          alert('Verication email cannot be sent: ' + err.message);
        });
    }
    event.preventDefault();
  }

  handleLogout(event) {
    delete CurrentLogin.loginInfo;
    browserHistory.push('/');
  }

  render() {
    return (
      <div className="home">
        <div>Welcome {CurrentLogin.loginInfo.username}!</div>
        <LastBlobIDChangeDate date={this.state.lastBlobIDChangeDate} />
        <div>
          Ripple address: {CurrentLogin.loginInfo.blob.data.account_id}
        </div>
        <br />
        <EmailField blob={CurrentLogin.loginInfo.blob} self={this} />
        <br />
        <div>
          First Name: {CurrentLogin.loginInfo.blob.data.firstName}<br />
          Last Name: {CurrentLogin.loginInfo.blob.data.lastName}
        </div>
        <br />
        <div>
          Account Level: {CurrentLogin.loginInfo.blob.account_level}
        </div>
        <IDPhotosStatus id_photos={CurrentLogin.loginInfo.blob.id_photos} />
        <br />
        <div>
          <Link to="/rename">Change Username</Link>
          <br />
          <Link to="/changepw">Change Password</Link>
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
