import React from 'react';

export default class DropdownMenu extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    if (this.props.items.length > 0) {
      this.props.onChange(this.props.items[0]);
    }
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    const options = this.props.items.map((item) => {
      return (
        <option key={item}>{item}</option>
      );
    });
    return (
      <select onChange={this.handleChange}>
        {options}
      </select>
    );
  }
}
