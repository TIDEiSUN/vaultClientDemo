import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import VaultClientDemo from '../logics/VaultClientDemo';

function SecretKeyDiv(props) {
  const self = props.self;
  if (props.secret) {
    return (
      <div>
        <p>Public address: {props.public}</p>
        <p>Secret key: {props.secret}</p>
       </div>
    );
  } else {
    return (
      <div>
        <AsyncButton
          type="button"
          onClick={self.handleUnlock}
          pendingText="Unlocking..."
          fulFilledText="Unlocked"
          rejectedText="Failed! Try Again"
          text="Unlock"
        />
      </div>
    );
  }
}

export default class MakePaymentPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      public: CurrentLogin.loginInfo.blob.data.account_id,
      secret: CurrentLogin.loginInfo.secret,
    };
    this.handleUnlock = this.handleUnlock.bind(this);
  }

  handleUnlock() {
    console.log('Handle unlock');
    return VaultClientDemo.unlockAccount(CurrentLogin.loginInfo)
      .then((result) => {
        this.setState({
          secret: result.secret,
        });
        console.log(result);
        alert('Success!');
      }).catch(err => {
        console.error('Failed to unlock:', err);
        alert('Failed to unlock: ' + err.message);
        throw err;
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Ripple Account Info</h1>
        <SecretKeyDiv self={this} public={this.state.public} secret={this.state.secret} />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
