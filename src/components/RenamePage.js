import React from 'react';
import { Link } from 'react-router';
import * as VaultClientDemo from '../logics/VaultClientDemo'
import { CurrentLogin } from './Data'

export default class RenamePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUsername: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Handle rename account');
    VaultClientDemo.renameAccount(CurrentLogin.username, this.state.newUsername, CurrentLogin.password, CurrentLogin.loginInfo)
      .then(result => {
        CurrentLogin.username = this.state.newUsername;
        console.log(result);
        alert('Success!');
      }).catch(err => {
        alert('Failed to rename account: ' + err.message);
      });
    event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Change username</h1>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>
              New username: 
              <input type="text" value={this.state.newUsername} onChange={this.handleChange.bind(this, 'newUsername')} />
            </label>
          </div>
          <input type="submit" value="Change" />
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}