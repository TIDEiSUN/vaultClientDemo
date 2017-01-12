import React from 'react';
import { Link } from 'react-router';

export default class RenamePage extends React.Component {
  render() {
    return (
      <div className="home">
        <li>This is RenamePage</li>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}