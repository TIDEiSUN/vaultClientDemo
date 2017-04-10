import React from 'react';
import { VaultClientDemo } from '../../logics';
import AuthenticationForm from './AuthenticationForm';

const systemParams = {
  forceSms: 'true',
};

const defaultParams = {};

export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      login: {
        customKeys: null,
      },
    };
    const { username } = props;
    if (username) {
      defaultParams.username = username;
    }
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
        console.log('LoginForm - componentDidMount', err);
      });
  }

  processBlob(auth, login) {
    const { result: blobResult } = auth;
    const { customKeys } = login;
    return VaultClientDemo.handleLogin(blobResult, customKeys)
      .then((result) => {
        return this.props.loginCallback(result);
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
        if (resp.step !== 'done') {
          return Promise.resolve();
        }
        return this.processBlob(resp, updatedLogin);
      })
      .catch((err) => {
        if (!auth.authToken) {
          this.setState({ auth: this.initAuthState });
        }
        alert(`Failed! ${err.message}`);
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} defaultParams={defaultParams} />
    );
  }
}
