import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo'
import AsyncButton from './AsyncButton'

export default class RegistrationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      email: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Register account');
    const activateLink = 'http://localhost:3000/activate';     // TODO

    return VaultClientDemo.registerAccount(this.state.username, this.state.password, this.state.email, activateLink)
      .then(result => {
        console.log('Register sucessfully', result);
        alert('Account created. Verification email has been sent to ' + this.state.email);
      }).catch(err => {
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