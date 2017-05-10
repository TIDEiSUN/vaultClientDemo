import React from 'react';
import { Link } from 'react-router';
import { VaultClient } from '../logics'
import { CurrentLogin } from './Data'
import AsyncButton from './common/AsyncButton'

export default class ChangePasswordPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Handle change password');
    return CurrentLogin.loginInfo.customKeys.isPasswordCorrect(this.state.oldPassword)
      .then((result) => {
        if (!result.correct) {
          return Promise.reject(new Error('Incorrect old password'));
        }
        return VaultClient.changePassword(CurrentLogin.loginInfo.username, this.state.newPassword, CurrentLogin.loginInfo);
      })
      .then((result) => {
        console.log('change password', result);
        CurrentLogin.loginInfo = result.loginInfo;
        alert('Success!');
        return Promise.resolve();
      }).catch(err => {
        console.error('Failed to change password:', err);
        alert('Failed to change password: ' + err.message);
        return Promise.reject(err);
      });
  }
  
  render() {
    return (
      <div className="home">
        <h1>Change Password</h1>
        <form>
          <div>
            <label>
              Old password: 
              <input type="password" value={this.state.oldPassword} onChange={this.handleChange.bind(this, 'oldPassword')} />
            </label>
          </div>
          <div>
            <label>
              New password: 
              <input type="password" value={this.state.newPassword} onChange={this.handleChange.bind(this, 'newPassword')} />
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