import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo'

function ActivateButton(props) {
  if(!props.username || !props.token) {
    return (
      <div>
        <li>Invalid Username or Token</li>
      </div>
    );
  }

  return (
    <div>
      <li>Username: {props.username}</li>
      <li>Token: {props.token}</li>
      <button onClick={props.target.handleActivate}>Activate</button>
    </div>
  );
}

export default class ActivatePage extends React.Component {
  constructor(props) {
    super(props);
    this.handleActivate = this.handleActivate.bind(this);
  }

  handleActivate() {
    VaultClientDemo.verifyEmailToken(this.props.location.query.username, this.props.location.query.token)
      .then(result => {
        alert('Success!');
      }).catch(err => {
        alert('Failed to activate account: ' + err.message);
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Activate Account</h1>
        <ActivateButton username={this.props.location.query.username} token={this.props.location.query.token} target={this}/>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}