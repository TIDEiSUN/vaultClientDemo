import React from 'react';
import AsyncButton from '../common/AsyncButton';
import { CurrentLogin } from '../Data';
import VaultClientDemo from '../../logics/VaultClientDemo';

export default class UnlockButton extends React.Component {
  constructor(props) {
		super(props);
		// this.state = {
		// 	secret: props.secret,
		// }
		this.handleUnlock = this.handleUnlock.bind(this);
	}

  handleUnlock() {
    console.log('Handle unlock');
    return VaultClientDemo.unlockAccount(CurrentLogin.loginInfo)
      .then((loginInfo) => {
        console.log('unlock', loginInfo);
        CurrentLogin.loginInfo = loginInfo;
        this.setState({
          secret: loginInfo.secret,
        });
				this.props.onUpdate({ secret: loginInfo.secret });
        alert('Success!');
      }).catch(err => {
        console.error('Failed to unlock:', err);
        alert('Failed to unlock: ' + err.message);
        throw err;
      });
  }

	render() {
		if (this.props.secret) {
			return (
				<div>
					<p>Public address: {this.props.public}</p>
					<p>Secret key: {this.props.secret}</p>
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