import React from 'react';
import { Link, browserHistory } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'
import AsyncButton from './common/AsyncButton'

export default class UnblockAccountPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      countryCode: '',
      phoneNumber: '',
      newPassword: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Unblock account');

    const email = this.state.email;
    const phone = (this.state.countryCode || this.state.phoneNumber) ? { phoneNumber: this.state.phoneNumber, countryCode: this.state.countryCode } : null;

    // let userAuthInfo;
    // return VaultClientDemo.getAuthInfoByEmail(email)
    //   .then((authInfo) => {
    //     console.log(authInfo);
    //     userAuthInfo = authInfo;
    //     if (!userAuthInfo.exists) {
    //       return Promise.reject(new Error('email is wrong'));
    //     }
    //     if (!userAuthInfo.emailVerified) {
    //       return Promise.resolve('not verified');
    //     }
    //     const activateLink = '123';
    //     return VaultClientDemo.requestEmailTokenForUnblockAccount(userAuthInfo.blobvault, userAuthInfo.username, email, activateLink);
    //   })
    //   .then((result) => {
    //     console.log('email:', result);
    //     // return VaultClientDemo.requestPhoneTokenForUnblockAccount(userAuthInfo.blobvault, userAuthInfo.username, phone.countryCode, phone.phoneNumber);
    //   })
    // //   .then((result) => {
    // //     console.log('phone:', result);
    // //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });

    return VaultClientDemo.unblockAccount(email, phone)
      .then((result) => {
        console.log('Unblock account successfully', result);
        CurrentLogin.username = result.username;
        CurrentLogin.loginInfo = result;
        return VaultClientDemo.changePassword(CurrentLogin.username, this.state.newPassword, CurrentLogin.loginInfo);
      }).then((result) => {
        CurrentLogin.password = this.state.newPassword;
        console.log('change password', result);
        CurrentLogin.loginInfo = result.loginInfo;
      }).catch((err) => {
        delete CurrentLogin.username;
        delete CurrentLogin.password;
        delete CurrentLogin.loginInfo;
        console.error('Failed to unblock account:', err);
        alert('Failed to unblock account: ' + err.message);
        throw err;
      });
    //event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Recover Account</h1>
        <form>
          <div>
            <label>
              Email: 
              <input type="text" value={this.state.email} onChange={this.handleChange.bind(this, 'email')} />
            </label>
          </div>
          <div>
            <label>
              Country code: 
              <input type="text" value={this.state.countryCode} onChange={this.handleChange.bind(this, 'countryCode')} />
            </label>
          </div>
          <div>
            <label>
              Phone number: 
              <input type="text" value={this.state.phoneNumber} onChange={this.handleChange.bind(this, 'phoneNumber')} />
            </label>
          </div>
          <div>
            <label>
              New Password: 
              <input type="password" value={this.state.newPassword} onChange={this.handleChange.bind(this, 'newPassword')} />
            </label>
          </div>
          <AsyncButton
           type="button"
           onClick={this.handleSubmit}
           pendingText="Unblocking..."
           fulFilledText="Unblocked"
           rejectedText="Failed! Try Again"
           text="Unblock"
           fullFilledRedirect="/main"
          />
        </form>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}