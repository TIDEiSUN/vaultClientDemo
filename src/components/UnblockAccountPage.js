import React from 'react';
import { Link, browserHistory } from 'react-router';
import { VaultClientDemo } from '../logics'
import { CurrentLogin } from './Data'
import AsyncButton from './common/AsyncButton';
import AuthenticationForm from './common/AuthenticationForm';

function ChangePasswordForm(props) {
  const { auth, self } = props;
  if (!auth || !auth.operationResult) {
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
      email: '',
      countryCode: '',
      phoneNumber: '',
      newPassword: '',
      step: 'emailTokenRequest',
      params: {
        email: '',
        hostlink: '',
      },
      auth: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmitAuthenticationForm(params) {
    const { auth } = this.state;
    const data = auth ? { ...auth, params } : params;
    // TODO
    if (params.email) {
      this.setState({ email: params.email });
    }
    if (params.countryCode) {
      this.setState({ countryCode: params.countryCode });
    }
    if (params.phoneNumber) {
      this.setState({ phoneNumber: params.phoneNumber });
    }

    return VaultClientDemo.authUnblockAccountVerify(data)
      .then((resp) => {
        alert('OK!');
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
      })
      .catch((err) => {
        alert(`Failed! ${err.message}`);
      });
  }

  handleSubmit(event) {
    console.log('Unblock account');

    const email = this.state.email;
    const phone = (this.state.countryCode || this.state.phoneNumber) ? { phoneNumber: this.state.phoneNumber, countryCode: this.state.countryCode } : null;

    return VaultClientDemo.handleRecovery(this.state.auth.operationResult, email, phone)
      .then((result) => {
        console.log('Unblock account successfully', result);
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
        console.error('Failed to unblock account:', err);
        alert('Failed to unblock account: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Recover Account</h1>
        <AuthenticationForm step={this.state.step} params={this.state.params} submitForm={this.handleSubmitAuthenticationForm} />
        <ChangePasswordForm auth={this.state.auth} self={this} />
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}
