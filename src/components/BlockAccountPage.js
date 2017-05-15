import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils } from '../logics';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';

export default class BlockAccountPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
          alert('Failed to get bank accounts');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleSubmit() {
    console.log('Handle block account');
    const { loginInfo } = this.state;
    return VaultClient.blockAccount(loginInfo.username, loginInfo)
      .then((result) => {
        this.setState({ loginInfo: null });
        console.log('block account', result);
        alert('Success!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('block account', err);
        alert('Failed to block account');
        return Promise.reject(err);
      });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = (
        <div>
          <AsyncButton
            type="button"
            onClick={this.handleSubmit}
            pendingText="Blocking..."
            fulFilledText="Blocked"
            rejectedText="Failed! Try Again"
            text="Block"
            fullFilledRedirect="/"
          />
        </div>
      );
    }
    return (
      <div className="home">
        <h1>Block account</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}