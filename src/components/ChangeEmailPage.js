import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import Config from '../logics/config';

export default class ChangeEmailPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newEmail: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmit(event) {
    console.log('Handle rename account');
    const activateLink = Config.emailVerificationURL;

    const oldEmail = CurrentLogin.loginInfo.blob.data.email ? CurrentLogin.loginInfo.blob.data.email : '';
    const newEmail = this.state.newEmail ? this.state.newEmail : oldEmail;
    const emailChanged = oldEmail !== newEmail;
    console.log(`old email: ${oldEmail}`);
    console.log(`new email: ${newEmail}`);
    console.log(`email changed: ${emailChanged}`);

    if (!emailChanged && CurrentLogin.loginInfo.emailVerified) {
      alert('Email has been verified.');
      return Promise.reject(new Error('Email has been verified.'));
    } else {
      return VaultClientDemo.resendVerificationEmail(CurrentLogin.username, CurrentLogin.password, newEmail, activateLink, CurrentLogin.loginInfo)
        .then((result) => {
          console.log('request update email', result);
          CurrentLogin.loginInfo = result.loginInfo;
          alert('Verification email has been sent to ' + newEmail);
        }).catch(err => {
          console.error('Verication email cannot be sent:', err);
          alert('Verication email cannot be sent: ' + err.message);
          throw err;
        });
    }
    
    //event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Change Email</h1>
        <form>
          <div>
            <label>
              New email:
              <input type="text" value={this.state.newEmail} onChange={this.handleChange.bind(this, 'newEmail')} />
            </label>
          </div>
          <AsyncButton
            type="button"
            onClick={this.handleSubmit}
            pendingText="Changing..."
            fulFilledText="Changed"
            rejectedText="Failed! Try Again"
            text="Change"
            />
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}