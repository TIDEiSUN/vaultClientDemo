import React from 'react';
import AsyncButton from './AsyncButton';

export default class AuthenticationForm extends React.Component {
  constructor(props) {
    super(props);
    const { step, params } = props;
    this.state = {
      step: props.step,
      params: props.params,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(props) {
    const { step, params } = props;
    this.setState({ step, params });
  }

  handleSubmit() {
    return this.props.submitForm(this.state.params);
  }

  handleParamChange(name, event) {
    const { params } = this.state;
    const newParams = { ...params };
    newParams[name] = event.target.value;
    this.setState({ params: newParams });
  }

  render() {
    if (!this.state.step) {
      return null;
    }
    const { params } = this.state;
    const paramInputs = Object.keys(params).map((key) => {
      return (
        <div>
          {key}:
          <input type="text" value={params[key]} onChange={this.handleParamChange.bind(this, key)} />
        </div>
      );
    });
    return (
      <div>
        <h1>{this.state.step}</h1>
        {paramInputs}
        <AsyncButton
          type="button"
          onClick={this.handleSubmit}
          pendingText="Wait..."
          fulFilledText="Submitted"
          rejectedText="Failed! Try Again"
          text="Submit"
        />
      </div>
    );
  }
}
