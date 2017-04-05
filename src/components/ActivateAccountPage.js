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
      <div>
        Password:
        <input type="password" value={self.state.password} onChange={self.handleChange.bind(self, 'password')} />
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
    this.state = {
      password: '',
    };
    this.customKeys = null;

    this.handleActivateAccount = this.handleActivateAccount.bind(this);
  }

  handleActivateAccount() {
    const { username, email, token, operationId } = this.props.location.query;
    const { password } = this.state;
    return VaultClientDemo.createCustomKeys(username, password)
      .then((customKeys) => {
        return customKeys.deriveKeys();
      })
      .then((customKeys) => {
        console.log('Verifiy: OperationId', operationId);
        const verifyPromise = VaultClientDemo.authVerifyAccountEmailToken(customKeys, email, token, operationId);
        return Promise.all([customKeys, verifyPromise]);
      })
      .then(([customKeys, resp]) => {
        const { operationId: newOperationId, blob: blobData } = resp;
        console.log('Activate: OperationId', newOperationId);
        const activatePromise = VaultClientDemo.authActivateAccount(customKeys, email, newOperationId, blobData);
        return Promise.all([customKeys, activatePromise]);
      })
      .then(([customKeys]) => {
        const data = {
          operationId: null,
          step: 'blobIdVerify',
          params: { blobId: customKeys.id },
        };
        const loginPromise = VaultClientDemo.authLoginAccount(customKeys.authInfo, data);
        return Promise.all([customKeys, loginPromise]);
      })
      .then(([customKeys, resp]) => {
        const { result: blobResult } = resp;
        return VaultClientDemo.handleLogin(blobResult, customKeys);
      })
      .then((result) => {
        CurrentLogin.username = result.username;
        CurrentLogin.password = this.state.password;
        CurrentLogin.loginInfo = result;
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
