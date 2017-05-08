import React from 'react';
import { Link, browserHistory } from 'react-router';
import { VaultClient } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';

function ActivateButton(props) {
  const { self } = props;
  const { username, email, token, authToken } = self.props.location.query;

  const disabled = !username || !token || !email || !authToken;

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
        Authentication Token: {authToken}
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
    const { username, email, token, authToken } = this.props.location.query;
    console.log('Verifiy: AuthToken', authToken);
    return VaultClient.authVerifyAccountEmailToken(username, email, token, authToken)
      .then((resp) => {
        const { authToken: newAuthToken, blob, createAccountToken } = resp;
        console.log('Activate: AuthToken', newAuthToken);
        const recoveryPromise = VaultClient.handleRecovery(blob, email);
        return Promise.all([newAuthToken, createAccountToken, recoveryPromise]);
      })
      .then(([newAuthToken, createAccountToken, loginInfo]) => {
        console.log('Recover account successfully', loginInfo);
        return VaultClient.authActivateAccount(loginInfo, email, newAuthToken, createAccountToken);
      })
      .then((result) => {
        const { loginInfo, loginToken } = result;
        CurrentLogin.loginInfo = loginInfo;
        CurrentLogin.loginToken = loginToken;
        console.log('Activate sucessfully', result);
        console.log('Activated - token', loginToken);
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
