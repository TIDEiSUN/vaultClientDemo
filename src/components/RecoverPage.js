import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Config } from '../logics';
import AsyncButton from './common/AsyncButton';
import AuthenticationForm from './common/AuthenticationForm';

const systemParams = {
  hostlink: Config.recoverAccountURL,
  via: 'sms',
};

function ChangePasswordForm(props) {
  const { auth, self } = props;
  if (!auth || auth.step !== 'done') {
    return null;
  }
  return (
    <div>
      <h1>Change password</h1>
      <div>
        New Password: 
        <input type="password" value={self.state.newPassword} onChange={self.handleChange.bind(self, 'newPassword')} />
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmit}
        pendingText="Recovering..."
        fulFilledText="Recovered"
        rejectedText="Failed! Try Again"
        text="Recover"
        fullFilledRedirect="/main"
      />
    </div>
  );
}

export default class RecoverPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      recover: {
        email: '',
      },
      newPassword: '',
    };
    const {
      email,
      token,
      authToken,
    } = props.location.query;

    if (email && token && authToken) {
      this.state.auth = {
        authToken,
        step: 'emailToken',
        params: {
          email,
          emailToken: token,
        },
      };
      console.log('recover - verify');
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
    this.handleInitAuthenticationForm = this.handleInitAuthenticationForm.bind(this);
  }

  handleInitAuthenticationForm() {
    if (this.state.auth) {
      return;
    }
    console.log('recover - request');
    VaultClient.authRecoverAccount()
      .then((resp) => {
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
      })
      .catch((err) => {
        console.log('RecoverPage - componentDidMount', err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmitAuthenticationForm(params) {
    const objHasOwnProp = Object.prototype.hasOwnProperty;
    const { auth, recover } = this.state;
    const data = auth ? { ...auth, params } : params;

    const updatedRecover = { ...recover };
    Object.keys(recover).forEach((key) => {
      if (objHasOwnProp.call(params, key)) {
        updatedRecover[key] = params[key];
      }
    });
    this.setState({ recover: updatedRecover });

    return VaultClient.authRecoverAccount(data)
      .then((resp) => {
        alert('OK!');
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
        return Promise.resolve();
      })
      .catch((err) => {
        alert(`Failed! ${err.message}`);
        return Promise.reject(err);
      });
  }

  handleSubmit() {
    console.log('Recover account');

    const { email } = this.state.recover;

    const { blob, loginToken } = this.state.auth.result;
    console.log('Recovered - token', loginToken);
    return VaultClient.handleRecovery(blob, email)
      .then((result) => {
        console.log('Recover blob successfully', result);
        const loginInfo = result;
        return VaultClient.changePassword(loginInfo.username, this.state.newPassword, loginInfo);
      }).then((result) => {
        console.log('change password', result);
        return Promise.resolve();
      }).catch((err) => {
        console.error('Failed to change password:', err);
        alert('Failed to change password: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Recover Account</h1>
        <AuthenticationForm auth={this.state.auth} initForm={this.handleInitAuthenticationForm} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} />
        <ChangePasswordForm auth={this.state.auth} self={this} />
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}
