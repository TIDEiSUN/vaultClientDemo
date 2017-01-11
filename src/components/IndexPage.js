import React from 'react';
import SimpleDate from '../logics/SimpleDate'

export default class IndexPage extends React.Component {
  render() {
        // "today" is guaranteed to be valid and fully initialized
        let today = new SimpleDate(2000, 2, 28);

        // Manipulating data only through a fixed set of functions ensures we maintain valid state
        today.addDays(1);

        let displayDate = `${today._year} ${today._month} ${today._day}`;
    return (
      <div className="home">
        <li>This is index page @ {displayDate}</li>
      </div>
    );
  }
}