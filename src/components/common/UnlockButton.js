import React from 'react';
import AsyncButton from '../common/AsyncButton';
import { VaultClient } from '../../logics';

export default class UnlockButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paymentPin: '',
    };
    this.handleUnlock = this.handleUnlock.bind(this);
    this.handlePaymentPinChange = this.handleChange.bind(this, 'paymentPin');
  }

  handleUnlock() {
    console.log('Handle unlock');
    const { hasPaymentPin, unlockSecret } = this.props;
    const paymentPin = hasPaymentPin ? this.state.paymentPin : undefined;
    return VaultClient.unlockAccount(unlockSecret, paymentPin)
      .then((result) => {
        const { secret, customKeys } = result;
        this.setState({
          secret: secret,
        });
        this.props.onUnlock(result);
        alert('Success!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('Failed to unlock:', err);
        alert('Failed to unlock: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  render() {
    const { secret, address, hasPaymentPin, unlockSecret } = this.props;
    if (address === null || hasPaymentPin === null || unlockSecret === null) {
      return null;
    }
    let secretUI;
    if (secret) {
      secretUI = secret;
    } else {
      let paymentPinInput = null;
      if (hasPaymentPin) {
        paymentPinInput = (
          <input type="password" value={this.state.paymentPin} onChange={this.handlePaymentPinChange} />
        );
      }
      secretUI = (
        <span>
          {paymentPinInput}
          <AsyncButton
            type="button"
            onClick={this.handleUnlock}
            pendingText="Unlocking..."
            fulFilledText="Unlocked"
            rejectedText="Failed! Try Again"
            text="Unlock"
          />
        </span>
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
