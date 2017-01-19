import React from 'react';
import { Link, browserHistory } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'
import AsyncButton from './AsyncButton'

export default class RecoverPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      secret: '',
      newPassword: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Recover account');

    return VaultClientDemo.recoverBlob(this.state.username, this.state.secret)
      .then(result => {
        console.log('Recover blob successfully', result);
        CurrentLogin.username = this.state.username;
        CurrentLogin.loginInfo = result;
        return VaultClientDemo.changePassword(this.state.username, this.state.newPassword, CurrentLogin.loginInfo);
      }).then(result => {
        CurrentLogin.password = this.state.newPassword;
        console.log(result);
//        alert('Recover account successfully!');
        //browserHistory.push('/main');
      }).catch(err => {
        delete CurrentLogin.username;
        delete CurrentLogin.password;
        delete CurrentLogin.loginInfo;
        alert('Failed to recover account: ' + err.message);
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
              Username: 
              <input type="text" value={this.state.username} onChange={this.handleChange.bind(this, 'username')} />
            </label>
          </div>
          <div>
            <label>
              Secret: 
              <input type="text" value={this.state.secret} onChange={this.handleChange.bind(this, 'secret')} />
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
           pendingText="Recovering..."
           fulFilledText="Recovered"
           rejectedText="Failed! Try Again"
           text="Recover"
           fullFilledRedirect="/main"
          />
        </form>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}