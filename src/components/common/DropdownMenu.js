import React from 'react';

export default class DropdownMenu extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.firstItem = null;
    this.selectedItem = null;
    this.componentWillReceiveProps(props);
  }

  componentWillReceiveProps(props) {
    const { items } = props;
    if (items.length > 0) {
      const item = items[0]
      if (item !== this.firstItem) {
        this.firstItem = item;
        this.selectedItem = item;
        this.props.onChange(item);
      }
    }
  }

  handleChange(event) {
    const item = event.target.value;
    if (item !== this.selectedItem) {
      this.selectedItem = item;
      this.props.onChange(item);
    }
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
