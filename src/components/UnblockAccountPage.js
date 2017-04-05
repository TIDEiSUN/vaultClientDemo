import React from 'react';
import { Link } from 'react-router';
import { VaultClientDemo, Config } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import AuthenticationForm from './common/AuthenticationForm';

const systemParams = {
  hostlink: Config.unblockAccountURL,
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
        pendingText="Unblocking..."
        fulFilledText="Unblocked"
        rejectedText="Failed! Try Again"
        text="Unblock"
        fullFilledRedirect="/main"
      />
    </div>
  );
}

export default class UnblockAccountPage extends React.Component {
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
      unblock: {
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
    console.log(`unblock - ${this.state.auth.step}`);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmitAuthenticationForm(params) {
    const objHasOwnProp = Object.prototype.hasOwnProperty;
    const { auth, unblock } = this.state;
    const data = auth ? { ...auth, params } : params;

    const updatedUnblock = { ...unblock };
    Object.keys(unblock).forEach((key) => {
      if (objHasOwnProp.call(params, key)) {
        updatedUnblock[key] = params[key];
      }
    });
    this.setState({ unblock: updatedUnblock });

    return VaultClientDemo.authUnblockAccount(data)
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
    console.log('Unblock account');

    const { email, phoneNumber, countryCode } = this.state.unblock;
    const phone = (countryCode || phoneNumber) ? { phoneNumber, countryCode } : null;

    return VaultClientDemo.handleRecovery(this.state.auth.result, email, phone)
      .then((result) => {
        console.log('Unblock account successfully', result);
        CurrentLogin.loginInfo = result;
        return VaultClientDemo.changePassword(CurrentLogin.loginInfo.username, this.state.newPassword, CurrentLogin.loginInfo);
      }).then((result) => {
        console.log('change password', result);
        CurrentLogin.loginInfo = result.loginInfo;
      }).catch((err) => {
        delete CurrentLogin.loginInfo;
        console.error('Failed to unblock account:', err);
        alert('Failed to unblock account: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Unblock Account</h1>
        <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} />
        <ChangePasswordForm auth={this.state.auth} self={this} />
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}
