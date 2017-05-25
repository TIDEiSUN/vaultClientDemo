import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils, Errors } from '../logics';
import AsyncButton from './common/AsyncButton';
import AuthenticationForm from './common/AuthenticationForm';

const systemParams = {
  via: 'sms',
};

function ChangePinForm(props) {
  const { self } = props;
  return (
    <form>
      <div>
        <label>
          Old payment pin: 
          <input type="password" value={self.state.oldPaymentPin} onChange={self.handleOldPaymentPinChange} />
        </label>
      </div>
      <div>
        <label>
          New payment pin: 
          <input type="password" value={self.state.newPaymentPin} onChange={self.handleNewPaymentPinChange} />
        </label>
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmitChangePin}
        pendingText="Changing..."
        fulFilledText="Changed"
        rejectedText="Failed! Try Again"
        text="Change"
      />
      <AsyncButton
        type="button"
        onClick={self.handleChangeToRecoverMode}
        pendingText="Waiting..."
        fulFilledText="!"
        rejectedText="Failed! Try Again"
        text="Recover"
      />
    </form>
  );
}

function RecoveredChangePinForm(props) {
  const { self } = props;
  return (
    <form>
      <div>
        <label>
          New payment pin: 
          <input type="password" value={self.state.newPaymentPin} onChange={self.handleNewPaymentPinChange} />
        </label>
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmitRecoveredChangePin}
        pendingText="Changing..."
        fulFilledText="Changed"
        rejectedText="Failed! Try Again"
        text="Change"
      />
    </form>
  );
}

export default class ChangePaymentPinPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPaymentPin: '',
      newPaymentPin: '',
      loginInfo: null,
      recoverMode: false,
      recovered: false,
      auth: null,
      recover: {
        phoneNumber: '',
        countryCode: '',
      },
    };
    this.handleSubmitChangePin = this.handleSubmitChangePin.bind(this);
    this.handleSubmitRecoveredChangePin = this.handleSubmitRecoveredChangePin.bind(this);
    this.handleChangeToRecoverMode = this.handleChangeToRecoverMode.bind(this);
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
    this.handleInitAuthenticationForm = this.handleInitAuthenticationForm.bind(this);
    this.handleOldPaymentPinChange = this.handleChange.bind(this, 'oldPaymentPin');
    this.handleNewPaymentPinChange = this.handleChange.bind(this, 'newPaymentPin');
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          const recoverMode = !blob.has_payment_pin || blob.secret_locked;
          this.setState({
            loginInfo,
            recoverMode,
          });
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get login info');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleChangeToRecoverMode() {
    return new Promise((resolve, reject) => {
      this.setState({
        recoverMode: true,
      }, () => {
        resolve();
      });
    });
  }

  handleSubmitChangePin() {
    console.log('Handle change payment pin');
    const { loginInfo } = this.state;
    return VaultClient.unlockAccount(loginInfo.blob.data.unlock_secret, this.state.oldPaymentPin)
    // return loginInfo.customKeys.isPaymentPinCorrect(this.state.oldPaymentPin)
      .then((result) => {
        // if (!result.correct) {
        //   return Promise.reject(new Error('Incorrect old payment pin'));
        // }
        const { secret, customKeys } = result;
        loginInfo.customKeys = customKeys;
        return VaultClient.changePaymentPin(loginInfo.username, this.state.newPaymentPin, loginInfo, secret);
      })
      .then((result) => {
        console.log('change payment pin', result);
        this.setState({
          loginInfo: result.loginInfo,
        });
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        if (err instanceof Errors.FetchError && err.info) {
          const { secret_locked } = err.info;
          if (secret_locked) {
            this.setState({
              recoverMode: true,
            });
          }
        }
        console.error('Failed to change payment pin:', err);
        alert('Failed to change payment pin: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleSubmitRecoveredChangePin() {
    console.log('Handle change payment pin recovered');
    const { secret: authSecret } = this.state.auth.result;
    const { phoneNumber, countryCode } = this.state.recover;
    const phone = { phoneNumber, countryCode };
    const { loginInfo, newPaymentPin } = this.state;
    return VaultClient.handleSecretRecovery(authSecret, loginInfo.blob.data.unlock_secret, phone)
      .then((result) => {
        const { secret, customKeys } = result;
        loginInfo.customKeys = customKeys;
        return VaultClient.changePaymentPin(loginInfo.username, newPaymentPin, loginInfo, secret);
      })
      .then((result) => {
        console.log('change payment pin', result);
        this.setState({
          loginInfo: result.loginInfo,
          recoverMode: false,
          recovered: false,
        });
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to change payment pin:', err);
        alert('Failed to change payment pin: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleInitAuthenticationForm() {
    if (this.state.auth) {
      return;
    }
    console.log('recover payment pin - request');
    VaultClient.authRecoverSecret()
      .then((resp) => {
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
      })
      .catch((err) => {
        console.log('RecoverSecret - init', err);
      });
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

    return VaultClient.authRecoverSecret(data)
      .then((resp) => {
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
        if (resp.step === 'done') {
          this.setState({
            recovered: true,
          });
        }
        alert('OK!');
        return Promise.resolve();
      })
      .catch((err) => {
        alert(`Failed! ${err.message}`);
        return Promise.reject(err);
      });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      const phoneVerified = Utils.checkPhoneVerified(this.state.loginInfo.blob.account_level);
      if (!this.state.recoverMode) {
        childComponents = (
          <ChangePinForm self={this} />
        );
      } else if (this.state.recovered) {
        childComponents = (
          <RecoveredChangePinForm self={this} />
        );
      } else if (phoneVerified) {
        const { phone } = this.state.loginInfo.blob.data;
        const params = {
          ...systemParams,
          ...phone,
        };
        childComponents = (
          <AuthenticationForm auth={this.state.auth} initForm={this.handleInitAuthenticationForm} submitForm={this.handleSubmitAuthenticationForm} systemParams={params} />
        );
      } else {
        childComponents = (
          <p>Set up phone first!</p>
        );
      }
    }
    return (
      <div className="home">
        <h1>Change Payment Pin</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}