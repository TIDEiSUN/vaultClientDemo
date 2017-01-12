import React from 'react';
import { Link } from 'react-router';

export default class RegistrationPage extends React.Component {
  render() {
    return (
      <div className="home">
        <li>This is RegistrationPage</li>
        <Link to="/">Back to login page</Link>
      </div>
    );
  }
}