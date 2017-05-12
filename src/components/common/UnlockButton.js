import React from 'react';
import AsyncButton from '../common/AsyncButton';
import { CurrentLogin } from '../Data';
import { VaultClient } from '../../logics';

export default class UnlockButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleUnlock = this.handleUnlock.bind(this);
  }

  handleUnlock() {
    console.log('Handle unlock');
    return VaultClient.unlockAccount(CurrentLogin.loginInfo)
      .then((secret) => {
        this.setState({
          secret: secret,
        });
        this.props.onUpdate({ secret: secret });
        alert('Success!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('Failed to unlock:', err);
        alert('Failed to unlock: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    const { secret, address } = this.props;
    if (secret) {
      return (
        <div>
          <p>Public address: {address}</p>
          <p>Secret key: {secret}</p>
        </div>
      );
    } else {
      return (
        <div>
          <AsyncButton
            type="button"
            onClick={this.handleUnlock}
            pendingText="Unlocking..."
            fulFilledText="Unlocked"
            rejectedText="Failed! Try Again"
            text="Unlock"
          />
        </div>
      );
    }
  }
}
