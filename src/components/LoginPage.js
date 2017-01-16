import React from 'react';
import { Link, browserHistory } from 'react-router';
import * as VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'

export default class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    VaultClientDemo.loginAccount(this.state.username, this.state.password)
      .then(result => {
        CurrentLogin.username = result.username;
        CurrentLogin.password = this.state.password;
        CurrentLogin.loginInfo = result;
        console.log('Login sucessfully', result);
        browserHistory.push('/main');
      }).catch(err => {
        alert('Failed to login: ' + err.message);
      });
    event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>
              Username: 
              <input type="text" value={this.state.username} onChange={this.handleChange.bind(this, 'username')} />
            </label>
          </div>
          <div>
            <label>
              Password: 
              <input type="password" value={this.state.password} onChange={this.handleChange.bind(this, 'password')} />
            </label>
          </div>
          <input type="submit" value="Login" />
        </form>
        <Link to="/reg">Register</Link>
        <br/>
        <Link to="/recover">Recover</Link>
      </div>
    );
  }
}