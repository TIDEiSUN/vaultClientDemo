import React from 'react';
import { Link } from 'react-router';
import * as VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'

export default class ChangePasswordPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Handle change password');
    VaultClientDemo.changePassword(CurrentLogin.username, this.state.newPassword, CurrentLogin.loginInfo)
      .then(result => {
        CurrentLogin.password = this.state.newPassword;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to change password: ' + err.message);
      });
    event.preventDefault();
  }
  
  render() {
    return (
      <div className="home">
        <h1>Change Password</h1>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>
              New password: 
              <input type="password" value={this.state.newPassword} onChange={this.handleChange.bind(this, 'newPassword')} />
            </label>
          </div>
          <input type="submit" value="Change" />
        </form>
        
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}