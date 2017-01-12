import React from 'react';
import { Link } from 'react-router';

export default class MakePaymentPage extends React.Component {
  render() {
    return (
      <div className="home">
        <li>This is MakePaymentPage</li>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}