import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import AsyncButton from './common/AsyncButton';
import Config from '../logics/config';

export default class RegistrationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Register account');
    const activateLink = Config.accountActivationURL;

    const email = this.state.email;
    const username = email;
    const password = '';

    return VaultClientDemo.registerAccount(username, password, email, activateLink)
      .then(result => {
        console.log('Register sucessfully', result);
        alert('Account created. Verification email has been sent to ' + email);
      }).catch(err => {
        console.error('Failed to register:', err);
        alert('Failed to register: ' + err.message);
        throw err;
      });
    //event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Register Account</h1>
        <form>
          <div>
            <label>
              Email: 
              <input type="text" value={this.state.email} onChange={this.handleChange.bind(this, 'email')} />
            </label>
          </div>
          <AsyncButton
           type="button"
           onClick={this.handleSubmit}
           pendingText="Registering..."
           fulFilledText="Registered"
           rejectedText="Failed! Try Again"
           text="Register"
          />
        </form>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}