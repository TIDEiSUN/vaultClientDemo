import React from 'react';
import { Link } from 'react-router';

export default class IndexPage extends React.Component {
  render() {
    return (
      <div className="home">
        <li>This is index page</li>
        <Link to="/rename">Rename username</Link>
        <br/>
        <Link to="/changepw">Change Password</Link>
        <br/>
        <Link to="/payment">Make Payment</Link>
        <br/>
      </div>
    );
  }
}