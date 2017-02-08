import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';

export default class RenameAndChangePasswordPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUsername: '',
      newPassword: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmit(event) {
    console.log('Handle rename and change password');
    return VaultClientDemo.renameAndChangePassword(CurrentLogin.username, this.state.newUsername, this.state.newPassword, CurrentLogin.loginInfo)
      .then(result => {
        CurrentLogin.username = this.state.newUsername;
        CurrentLogin.password = this.state.newPassword;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        console.error('Failed to rename and change password:', err);
        alert('Failed to rename and change password: ' + err.message);
        throw err;
      });
    //event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Change Username and Password</h1>
        <form>
          <div>
            <label>
              New username: 
              <input type="text" value={this.state.newUsername} onChange={this.handleChange.bind(this, 'newUsername')} />
            </label>
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