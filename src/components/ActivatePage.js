import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';

function ActivateButton(props) {
  if (!props.token || !props.email) {
    return (
      <div>
        <li>Invalid Token or Email</li>
      </div>
    );
  }

  return (
    <div>
      <li>Token: {props.token}</li>
      <li>Email: {props.email}</li>
      <AsyncButton
        type="button"
        onClick={props.target.handleActivate}
        pendingText="Activating..."
        fulFilledText="Activated"
        rejectedText="Failed! Try Again"
        text="Activate"
        disabled={props.disabled}
      />
    </div>
  );
}

function LoginDiv(props) {
  if (props.loggedIn) {
    return (
      <div>
        <li>Username: {props.target.props.location.query.username}</li>
      </div>
    );
  }

  return (
    <form>
      <div>Username: {props.target.props.location.query.username}</div>
      <div>
        Password:
        <input type="password" value={props.target.state.password} onChange={props.target.handleChange.bind(props.target, 'password')} />
      </div>
      <AsyncButton
        type="button"
        onClick={props.target.handleLogin.bind(props.target)}
        pendingText="Logging in..."
        fulFilledText="Logged in"
        rejectedText="Failed! Try Again"
        text="Login"
      />
    </form>
  );
}

export default class ActivatePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: CurrentLogin && CurrentLogin.loginInfo,
      password: '',
    };
    this.handleActivate = this.handleActivate.bind(this);
  }

  handleActivate() {
    const queryString = this.props.location.query;
    return VaultClientDemo.verifyEmailToken(queryString.username, queryString.token, queryString.email, CurrentLogin.password, CurrentLogin.loginInfo)
      .then(result => {
        alert('Success!');
      }).catch(err => {
        alert('Failed to activate account: ' + err.message);
        throw err;
      });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleLogin(event) {
    return VaultClientDemo.loginAccount(this.props.location.query.username, this.state.password)
      .then(result => {
        CurrentLogin.username = result.username;
        CurrentLogin.password = this.state.password;
        CurrentLogin.loginInfo = result;
        console.log('Login sucessfully', result);
        this.setState({
          loggedIn: true,
        });
      }).catch(err => {
        alert('Failed to login: ' + err.message);
        throw err;
      });
  }

  render() {
    const queryString = this.props.location.query;
    return (
      <div className="home">
        <h1>Activate Account</h1>
        <LoginDiv loggedIn={this.state.loggedIn} target={this} />
        <ActivateButton username={queryString.username} token={queryString.token} email={queryString.email} disabled={!this.state.loggedIn} target={this}/>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}