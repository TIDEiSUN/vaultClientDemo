import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'
import AsyncButton from './AsyncButton'

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
    return VaultClientDemo.changePassword(CurrentLogin.username, this.state.newPassword, CurrentLogin.loginInfo)
      .then(result => {
        CurrentLogin.password = this.state.newPassword;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to change password: ' + err.message);
        throw err;
      });
    //event.preventDefault();
  }
  
  render() {
    return (
      <div className="home">
        <h1>Change Password</h1>
        <form>
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