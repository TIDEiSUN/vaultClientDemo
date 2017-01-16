import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data'

export default class MakePaymentPage extends React.Component {
  render() {
    return (
      <div className="home">
        <h1>Ripple Account Info</h1>
        <div>
          <p>Public address: {CurrentLogin.loginInfo.blob.data.account_id}</p>
          <p>Secret key: {CurrentLogin.loginInfo.secret}</p>
        </div>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}