import React from 'react';
import { VaultClient, Errors } from '../../logics';
import AuthenticationForm from './AuthenticationForm';

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
    VaultClient.getAuthInfoByUsername('dummy')
      .then((authInfo) => {
        return VaultClient.authLoginAccount(authInfo);
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
    return VaultClient.handleLogin(blob, customKeys)
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
    const { auth, login, params: requiredParams } = this.state;
    const params = {};

    let customKeysPromise;
    if (requiredParams.blobId !== undefined) {
      const { username, password } = inParams;
      customKeysPromise = VaultClient.createAndDeriveCustomKeys(username, password)
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

        return VaultClient.authLoginAccount(updatedLogin.customKeys.authInfo, data);
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
        if (err instanceof Errors.FetchError) {
          const errorMessage = err.info ? JSON.stringify(err.info, null, 2) : null;
          this.setState({ errorMessage });
        } else {
          this.setState({ errorMessage: null });
        }
        return Promise.reject(err);
      });
  }

  render() {
    return (
      <AuthenticationForm auth={this.state.auth} submitForm={this.handleSubmitAuthenticationForm} defaultParams={defaultParams} errorMessage={this.state.errorMessage} />
    );
  }
}
