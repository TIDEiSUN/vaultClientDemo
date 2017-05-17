import React from 'react';
import { Link, browserHistory } from 'react-router';
import { CurrentLogin } from './Data';
import LoginForm from './common/LoginForm';


export default class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.handleLogin = this.handleLogin.bind(this);
  }

  handleLogin(loginInfo) {
    console.log('Login sucessfully', loginInfo);
    browserHistory.push('/main');
    return Promise.resolve();
  }

  render() {
    return (
      <div className="home">
        <LoginForm loginCallback={this.handleLogin} />
        <Link to="/reg">Register</Link>
        <br />
        <Link to="/recover">Recover Account</Link>
        <br />
        <Link to="/unblock">Unblock Account</Link>
      </div>
    );
  }
}
