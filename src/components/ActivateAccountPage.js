import React from 'react';
import { Link, browserHistory } from 'react-router';
import { VaultClientDemo, RippleClient } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';

function ActivateButton(props) {
  const { self } = props;
  const { username, email, token, operationId } = self.props.location.query;

  const disabled = !username || !token || !email || !operationId;

  return (
    <div>
      <div>
        Username: {username}
      </div>
      <div>
        Email: {email}
      </div>
      <div>
        Token: {token}
      </div>
      <div>
        Operation ID: {operationId}
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleActivateAccount}
        pendingText="Activating..."
        fulFilledText="Activated"
        rejectedText="Failed! Try Again"
        text="Activate"
        disabled={disabled}
      />
    </div>
  );
}

export default class ActivateAccountPage extends React.Component {
  constructor(props) {
    super(props);
    this.handleActivateAccount = this.handleActivateAccount.bind(this);
  }

  handleActivateAccount() {
    const { username, email, token, operationId } = this.props.location.query;
    console.log('Verifiy: OperationId', operationId);
    return VaultClientDemo.authVerifyAccountEmailToken(username, email, token, operationId)
      .then((resp) => {
        const { operationId: newOperationId, blob } = resp;
        console.log('Activate: OperationId', newOperationId);
        const recoveryPromise = VaultClientDemo.handleRecovery(blob, email);
        return Promise.all([newOperationId, recoveryPromise]);
      })
      .then(([newOperationId, loginInfo]) => {
        console.log('Recover account successfully', loginInfo);
        return VaultClientDemo.authActivateAccount(loginInfo, email, newOperationId);
      })
      .then((result) => {
        const { loginInfo } = result;
        CurrentLogin.loginInfo = loginInfo;
        console.log('Activate sucessfully', result);
        RippleClient.connectToServer();
        browserHistory.push('/main');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to activate:', err);
        return Promise.reject(err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  render() {
    return (
      <div className="home">
        <h1>Activate Account</h1>
        <ActivateButton self={this} />
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}
