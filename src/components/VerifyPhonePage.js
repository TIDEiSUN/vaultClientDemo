import React from 'react';
import { Link } from 'react-router';
import * as VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'

export default class VerifyPhonePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      countryCode: '',
      phoneNumber: '',
      token: ''
    };
    this.handleSubmitSend = this.handleSubmitSend.bind(this);
    this.handleSubmitVerify = this.handleSubmitVerify.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmitSend(event) {
    console.log('Handle send verification code by sms');
    VaultClientDemo.sendPhoneVerificationCode(CurrentLogin.username, 
                                              this.state.countryCode, 
                                              this.state.phoneNumber)
      .then(result => {
        //CurrentLogin.password = this.state.newPassword;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to send verification code by sms: ' + err.message);
      });
    event.preventDefault();
  }

  handleSubmitVerify(event) {
    console.log('Handle verify phone');
    VaultClientDemo.verifyPhone(CurrentLogin.username, 
                                this.state.countryCode, 
                                this.state.phoneNumber,
                                this.state.token)
      .then(result => {
        //CurrentLogin.password = this.state.newPassword;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to verify phone: ' + err.message);
      });
    event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Send Verification Code</h1>
        <form onSubmit={this.handleSubmitSend}>
          <div>
            <label>
              Country code: 
              <input type="text" value={this.state.countryCode} onChange={this.handleChange.bind(this, 'countryCode')} />
            </label>
            <label>
              Phone number: 
              <input type="text" value={this.state.phoneNumber} onChange={this.handleChange.bind(this, 'phoneNumber')} />
            </label>
            <input type="submit" value="Send" />
          </div>
        </form>
        <form onSubmit={this.handleSubmitVerify}>
          <div>
            <label>
              Received token: 
              <input type="text" value={this.state.token} onChange={this.handleChange.bind(this, 'token')} />
            </label>
            <input type="submit" value="Verify" />
          </div>
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}