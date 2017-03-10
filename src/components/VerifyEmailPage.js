import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import AsyncButton from './AsyncButton';

function VerifyButton(props) {
  const disabled = props.disabled || !props.token || !props.email;

  return (
    <div>
      <li>Token: {props.token}</li>
      <li>Email: {props.email}</li>
      <AsyncButton
        type="button"
        onClick={props.target.handleVerifyToken}
        pendingText="Verifying..."
        fulFilledText="Verified"
        rejectedText="Failed! Try Again"
        text="Verify"
        disabled={disabled}
      />
    </div>
  );
}

export default class VerifyEmailPage extends React.Component {
  constructor(props) {
    super(props);
    this.handleVerifyToken = this.handleVerifyToken.bind(this);
  }

  handleVerifyToken() {
    const queryString = this.props.location.query;
    return VaultClientDemo.verifyEmailToken(queryString.username, queryString.token, queryString.email)
      .then((result) => {
        console.log('verifiy email token:', result);
        return VaultClientDemo.updateEmail(queryString.username, queryString.email);
      })
      .then((result) => {
        console.log('update email:', result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to verify email: ' + err.message);
        console.error('Failed to verify email:', err);
        throw err;
      });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  render() {
    const queryString = this.props.location.query;
    return (
      <div className="home">
        <h1>Verify Email Token</h1>
        <VerifyButton username={queryString.username} token={queryString.token} email={queryString.email} target={this}/>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}