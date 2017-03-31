import React from 'react';
import { Link } from 'react-router';
import { VaultClientDemo, Config } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import AuthenticationForm from './common/AuthenticationForm';

const systemParams = {
  hostlink: Config.recoverAccountURL,
  via: 'sms',
};

function ChangePasswordForm(props) {
  const { auth, self } = props;
  if (auth.step) {
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
      auth: {
        operationId: null,
        step: 'emailTokenRequest',
        params: {
          email: '',
          hostlink: '',
        },
      },
      recover: {
        email: '',
        countryCode: '',
        phoneNumber: '',
      },
      newPassword: '',
    };
    const {
      email,
      token,
      operationId,
    } = props.location.query;

    if (email && token && operationId) {
      this.state.auth = {
        operationId,
        step: 'emailTokenVerify',
        params: {
          email,
          emailToken: token,
        },
      };
    }
    console.log(`recover - ${this.state.auth.step}`);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
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

    return VaultClientDemo.authRecoverAccount(data)
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

    const { email, phoneNumber, countryCode } = this.state.recover;
    const phone = (countryCode || phoneNumber) ? { phoneNumber, countryCode } : null;

    return VaultClientDemo.handleRecovery(this.state.auth.result, email, phone)
      .then((result) => {
        console.log('Recover blob successfully', result);
        CurrentLogin.username = result.username;
        CurrentLogin.loginInfo = result;
        return VaultClientDemo.changePassword(CurrentLogin.username, this.state.newPassword, CurrentLogin.loginInfo);
      }).then((result) => {
        CurrentLogin.password = this.state.newPassword;
        console.log('change password', result);
        CurrentLogin.loginInfo = result.loginInfo;
      }).catch((err) => {
        delete CurrentLogin.username;
        delete CurrentLogin.password;
        delete CurrentLogin.loginInfo;
        console.error('Failed to recover account:', err);
        alert('Failed to recover account: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Recover Account</h1>
        <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} />
        <ChangePasswordForm auth={this.state.auth} self={this} />
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}
