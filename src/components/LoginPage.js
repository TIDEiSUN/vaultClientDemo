import React from 'react';
import { Link } from 'react-router';

export default class LoginPage extends React.Component {
  render() {
    return (
      <div className="home">
        <li>This is LoginPage</li>
        <Link to="/reg">Register</Link>
      </div>
    );
  }
}