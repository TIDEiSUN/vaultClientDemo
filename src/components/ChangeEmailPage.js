import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import Config from '../../config';

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
    return VaultClientDemo.resendVerificationEmail(CurrentLogin.username, CurrentLogin.password, this.state.newEmail, activateLink, CurrentLogin.loginInfo)
      .then(result => {
        alert('Verification email has been sent to ' + this.state.newEmail);
        CurrentLogin.loginInfo.blob.data.email = this.state.newEmail;
      }).catch(err => {
        alert('Verication email cannot be sent: ' + err.message);
        throw err;
      });
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