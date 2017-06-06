import React from 'react';
import { Link } from 'react-router';
import { VaultClient, VCUtils as Utils, VaultClientStorage } from '../logics';
import AsyncButton from './common/AsyncButton';

export default class ChangePasswordPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
      loginInfo: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const setLoginInfo = (loginInfo) => {
      this.setState({ loginInfo });
    };
    const promise = VaultClient.getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setLoginInfo)
      .catch((err) => {
        console.error('getLoginInfo', err);
        alert('Failed to get login info');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleSubmit() {
    console.log('Handle change password');
    const { loginInfo } = this.state;
    return VaultClientStorage.readCustomKeys()
      .then(customKeys => customKeys.isPasswordCorrect(this.state.oldPassword))
      .then((result) => {
        if (!result.correct) {
          return Promise.reject(new Error('Incorrect old password'));
        }
        return VaultClient.changePassword(loginInfo.username, this.state.newPassword, loginInfo);
      })
      .then((result) => {
        console.log('change password', result);
        this.setState({ loginInfo: result.loginInfo });
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Failed to change password:', err);
        alert('Failed to change password: ' + err.message);
        return Promise.reject(err);
      });
  }
  
  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = (
        <form>
          <div>
            <label>
              Old password: 
              <input type="password" value={this.state.oldPassword} onChange={this.handleChange.bind(this, 'oldPassword')} />
            </label>
          </div>
          <div>
            <label>
              New password: 
              <input type="password" value={this.state.newPassword} onChange={this.handleChange.bind(this, 'newPassword')} />
            </label>
          </div>
          <AsyncButton
            type="button"
            onClick={this.handleSubmit}
            pendingText="Changing..."
            fulFilledText="Changed"
            rejectedText="Failed! Try Again"
            text="Change"
          />
        </form>
      );
    }
    return (
      <div className="home">
        <h1>Change Password</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}