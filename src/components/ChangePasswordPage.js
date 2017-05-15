import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils } from '../logics';
import { CurrentLogin } from './Data';
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
    const getLoginInfo = () => {
      const { loginToken, customKeys } = CurrentLogin;
      return VaultClient.getLoginInfo(loginToken, customKeys)
        .then((loginInfo) => {
          this.setState({ loginInfo });
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

  handleSubmit() {
    console.log('Handle change password');
    const { loginInfo } = this.state;
    return loginInfo.customKeys.isPasswordCorrect(this.state.oldPassword)
      .then((result) => {
        if (!result.correct) {
          return Promise.reject(new Error('Incorrect old password'));
        }
        return VaultClient.changePassword(loginInfo.username, this.state.newPassword, loginInfo);
      })
      .then((result) => {
        console.log('change password', result);
        CurrentLogin.customKeys = result.loginInfo.customKeys;
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