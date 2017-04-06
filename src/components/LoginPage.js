import React from 'react';
import { Link, browserHistory } from 'react-router';
import { VaultClientDemo, RippleClient } from '../logics';
import { CurrentLogin } from './Data';
import AuthenticationForm from './common/AuthenticationForm';

const systemParams = {
  forceSms: 'true',
};

export default class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      login: {
        customKeys: null,
      },
      username: '',
      password: '',
    };
    this.handleSubmitAuthenticationForm = this.handleSubmitAuthenticationForm.bind(this);
  }

  componentDidMount() {
    VaultClientDemo.getAuthInfoByUsername('dummy')
      .then((authInfo) => {
        return VaultClientDemo.authLoginAccount(authInfo);
      })
      .then((resp) => {
        const { step: newStep = null, params: newParams = {} } = resp;
        this.initAuthState = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
      })
      .catch((err) => {
        console.log('LoginPage - componentDidMount', err);
      });
  }

  processBlob(auth, login) {
    const { result: blobResult } = auth;
    const { customKeys } = login;
    return VaultClientDemo.handleLogin(blobResult, customKeys)
      .then((result) => {
        CurrentLogin.loginInfo = result;
        console.log('Login sucessfully', result);
        RippleClient.connectToServer();
        browserHistory.push('/main');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to login:', err);
        return Promise.reject(err);
      });
  }

  handleSubmitAuthenticationForm(inParams) {
    const objHasOwnProp = Object.prototype.hasOwnProperty;
    const { auth, login } = this.state;
    const { blobId, username, password, ...params } = inParams;

    let customKeysPromise;
    if (blobId !== undefined) {
      customKeysPromise = VaultClientDemo.createCustomKeys(username, password)
        .then((customKeys) => {
          return customKeys.deriveLoginKeys();
        })
        .then((customKeys) => {
          params.blobId = customKeys.id;
          return Promise.resolve(customKeys);
        });
    } else {
      customKeysPromise = Promise.resolve(null);
    }

    const updatedLogin = { ...login };
    Object.keys(login).forEach((key) => {
      if (objHasOwnProp.call(params, key)) {
        updatedLogin[key] = params[key];
      }
    });

    return customKeysPromise
      .then((customKeys) => {
        const data = auth ? { ...auth, params } : params;

        if (customKeys) {
          updatedLogin.customKeys = customKeys;
        }
        this.setState({ login: updatedLogin });

        return VaultClientDemo.authLoginAccount(updatedLogin.customKeys.authInfo, data);
      })
      .then((resp) => {
        alert('OK!');
        const { step: newStep = null, params: newParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: newParams,
        });
        if (resp.step) {
          return Promise.resolve();
        }
        return this.processBlob(resp, updatedLogin);
      })
      .catch((err) => {
        if (!auth.operationId) {
          this.setState({ auth: this.initAuthState });
        }
        alert(`Failed! ${err.message}`);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <div className="home">
        <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} />
        <Link to="/reg">Register</Link>
        <br />
        <Link to="/recover">Recover Account</Link>
        <br />
        <Link to="/unblock">Unblock Account</Link>
      </div>
    );
  }
}
