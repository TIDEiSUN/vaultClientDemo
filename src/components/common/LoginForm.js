import React from 'react';
import { VaultClientDemo, Errors } from '../../logics';
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
      errorMessage: null,
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
        const { step: newStep = null, params = {}, resendParams = {} } = resp;
        this.initAuthState = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: { ...params, ...resendParams },
        });
      })
      .catch((err) => {
        console.log('LoginForm - componentDidMount', err);
      });
  }

  processBlob(auth, login) {
    const { result: blobResult } = auth;
    const { customKeys } = login;
    const { blob, loginToken } = blobResult;
    console.log('Login - token', loginToken);
    return VaultClientDemo.handleLogin(blob, customKeys)
      .then((result) => {
        return this.props.loginCallback(result, loginToken);
      })
      .catch((err) => {
        console.error('Failed to login:', err);
        return Promise.reject(err);
      });
  }

  handleSubmitAuthenticationForm(inParams) {
    const objHasOwnProp = Object.prototype.hasOwnProperty;
    const { auth, login, params: requiredParams } = this.state;
    const params = {};

    let customKeysPromise;
    if (requiredParams.blobId !== undefined) {
      const { username, password } = inParams;
      customKeysPromise = VaultClientDemo.createCustomKeys(username, password)
        .then((customKeys) => {
          return customKeys.deriveLoginKeys();
        })
        .then((customKeys) => {
          Object.keys(requiredParams).forEach((key) => {
            if (inParams[key]) {
              params[key] = inParams[key];
            }
          });
          params.blobId = customKeys.id;
          return Promise.resolve(customKeys);
        });
    } else {
      Object.keys(requiredParams).forEach((key) => {
        if (inParams[key]) {
          params[key] = inParams[key];
        }
      });
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
        const { step: newStep = null, params: newParams = {}, resendParams: newResendParams = {} } = resp;
        this.setState({
          auth: resp,
          step: newStep,
          params: { ...newParams, ...newResendParams },
          errorMessage: null,
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
        // FIXME instanceof Errors.FetchError does not work
        // if (err instanceof Errors.FetchError) {
          if (err.info) {
            const errorMessage = JSON.stringify(err.info, null, 2);
            this.setState({ errorMessage });
          } else {
            this.setState({ errorMessage: null });
          }
        // }
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} systemParams={systemParams} defaultParams={defaultParams} errorMessage={this.state.errorMessage} />
    );
  }
}
