import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import Config from '../logics/config';

export default class BlockAccountPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newEmail: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    console.log('Handle block account');
    return VaultClientDemo.blockAccount(CurrentLogin.username, CurrentLogin.loginInfo)
      .then((result) => {
        delete CurrentLogin.username;
        delete CurrentLogin.password;
        delete CurrentLogin.loginInfo;
        console.log('block account', result);
        alert('Success!');
      }).catch(err => {
        console.error('block account', err);
        alert('Failed to block account');
        throw err;
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Block account</h1>
        <div>
          <AsyncButton
            type="button"
            onClick={this.handleSubmit}
            pendingText="Blocking..."
            fulFilledText="Blocked"
            rejectedText="Failed! Try Again"
            text="Block"
            fullFilledRedirect="/"
          />
        </div>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}