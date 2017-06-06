import React from 'react';

export default class DropdownMenu extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.firstItemValue = null;
    this.selectedItemValue = null;
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }
  
  componentWillReceiveProps(props) {
    const { items } = props;
    if (items.length == 0) return;
    const item = items[0];
    const value = typeof item === 'string' ? item : item.value;
    if (value !== this.firstItemValue) {
      this.firstItemValue = value;
      this.selectedItemValue = value;
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    }
  }

  handleChange(event) {
    const value = event.target.value;
    if (value !== this.selectedItemValue) {
      this.selectedItemValue = value;
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    }
  }

  render() {
    const options = this.props.items.map((item) => {
      if (typeof item === 'string') {
        return (
          <option key={item} value={item}>{item}</option>
        );
      }
      return (
        <option key={item.value} value={item.value}>{item.label}</option>
      );
    });
    return (
      <select onChange={this.handleChange}>
        {options}
      </select>
    );
  }
}
