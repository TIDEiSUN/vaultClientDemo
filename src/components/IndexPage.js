import React from 'react';
import { Link, browserHistory } from 'react-router';
import { CurrentLogin } from './Data';
import VaultClientDemo from '../logics/VaultClientDemo';
import Config from '../logics/config';

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

function ResendVerificationButton(props) {
  if (props.verified) {
    return null;
  }

  return (
    <form onSubmit={props.target.handleResendEmail}>
      <div>
        <input type="text" value={props.target.state.resendEmail} onChange={props.target.handleChange.bind(props.target, 'resendEmail')} />
      </div>
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
      resendEmail: CurrentLogin.loginInfo.blob.data.email,
      lastBlobIDChangeDate: CurrentLogin.loginInfo.blob.last_id_change_date,
    };
    this.handleResendEmail = this.handleResendEmail.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleResendEmail(event) {
    console.log('Resend verification email');
    const activateLink = Config.accountActivationURL;

    const oldEmail = CurrentLogin.loginInfo.blob.data.email ? CurrentLogin.loginInfo.blob.data.email : '';
    const newEmail = this.state.resendEmail ? this.state.resendEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged && CurrentLogin.loginInfo.emailVerified) {
      alert('Email has been verified.');
    } else {
      VaultClientDemo.resendVerificationEmail(CurrentLogin.username, CurrentLogin.password, newEmail, activateLink, CurrentLogin.loginInfo)
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
    delete CurrentLogin.username;
    delete CurrentLogin.password;
    delete CurrentLogin.loginInfo;
    browserHistory.push('/');
  }

  render() {
    return (
      <div className="home">
        <div>Welcome {CurrentLogin.username}!</div>
        <LastBlobIDChangeDate date={this.state.lastBlobIDChangeDate} />
        <div>Ripple address: {CurrentLogin.loginInfo.blob.data.account_id}</div>
        <div>
          Email: {CurrentLogin.loginInfo.blob.data.email} [{CurrentLogin.loginInfo.emailVerified ? 'Verified' : 'Not verified'}]
          <ResendVerificationButton verified={CurrentLogin.loginInfo.emailVerified} target={this} />
        </div>
        <div>
          First Name: {CurrentLogin.loginInfo.blob.data.firstName}<br />
          Last Name: {CurrentLogin.loginInfo.blob.data.lastName}
        </div>
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
          <Link to="/payment">Make Payment</Link>
          <br />
          <Link to="/wallet">Show Wallet</Link>
        </div>
        <div>
          <LogoutButton target={this} />
        </div>
      </div>
    );
  }
}
