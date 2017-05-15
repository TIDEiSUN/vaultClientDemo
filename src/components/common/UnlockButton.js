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
    const { loginToken, customKeys } = CurrentLogin;
    return VaultClient.getLoginInfo(loginToken, customKeys)
      .then((loginInfo) => {
        return VaultClient.unlockAccount(loginInfo);
      })
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
    let secretUI;
    if (secret) {
      secretUI = secret;
    } else {
      secretUI = (
        <AsyncButton
          type="button"
          onClick={this.handleUnlock}
          pendingText="Unlocking..."
          fulFilledText="Unlocked"
          rejectedText="Failed! Try Again"
          text="Unlock"
        />
      );
    }
    return (
      <div>
        <p>Public address: {address}</p>
        <p>Secret key: {secretUI}</p>
      </div>
    );
  }
}
