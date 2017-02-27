import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import RippleClient from '../logics/RippleClient';
import UnlockButton from './button/UnlockButton';

function SendTransactionForm(props) {
  const self = props.self;
  return (
    <form>
      <div>
        External payment:
        <input type="checkbox" checked={self.state.externalPayment} onChange={self.handleChangeChk.bind(self, 'externalPayment')} />
      </div>
      <div>
        Destination address:
        <input type="text" value={self.state.destination} onChange={self.handleChange.bind(self, 'destination')} />
      </div>
      <div>
        Currency:
        <input type="text" value={self.state.currency} onChange={self.handleChange.bind(self, 'currency')} />
      </div>
      <div>
        Value:
        <input type="text" value={self.state.value} onChange={self.handleChange.bind(self, 'value')} />
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmitPaymentForm}
        pendingText="Sending..."
        fulFilledText="Sent"
        rejectedText="Failed! Try Again"
        text="Send"
      />
    </form>
  );
}

function AccountBalanceTable(props) {
  const rows = [];
  props.balances.forEach((balance) => {
    rows.push(
      <tr>
        <td>{balance.currency}</td>
        <td>{balance.value}</td>
      </tr>
    );
  });

  if (rows.length === 0) {
    return (
      <div>
        No currency!
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <td>Currency</td>
          <td>Value</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export default class MakePaymentPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      public: CurrentLogin.loginInfo.blob.data.account_id,
      secret: CurrentLogin.loginInfo.secret,
      balances: [],
      externalPayment: false,
      destination: '',
      currency: '',
      value: '',
    };
    this.handleSubmitPaymentForm = this.handleSubmitPaymentForm.bind(this);
    this.onUpdate = this.onUpdate.bind(this);

    RippleClient.getBalances(this.state.public)
      .then((balances) => {
        this.setState({
          balances,
        });
      });
  }

  onUpdate(data) {
    this.setState(data);
  }

  handleSubmitPaymentForm() {
    console.log('Handle send payment');
    RippleClient.getGatewayAddresses()
      .then((gatewayAddresses) => {
        const gatewayAddress = gatewayAddresses[0];
        const external = this.state.externalPayment;
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };
        const destination = this.state.destination;
        const currency = this.state.currency;
        const value = this.state.value;
        const paymentPromise = external ?
          RippleClient.sendExternalPayment(gatewayAddress, sourceAccount, destination, currency, value) :
          RippleClient.sendInternalPayment(gatewayAddress, sourceAccount, destination, currency, value);

        paymentPromise
          .then((result) => {
            console.log('Submit payment', result);
            alert('Success!');
          })
          .catch((err) => {
            console.error('Submit payment', err);
            alert('Failed! ' + err.message);
          });
      });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleChangeChk(name, event) {
    const checked = this.state[name];
    this.setState({[name]: !checked});
  }

  render() {
    return (
      <div className="home">
        <h1>Ripple Account Info</h1>
        <UnlockButton public={this.state.public} secret={this.state.secret} onUpdate={this.onUpdate} />
        <br />
        <AccountBalanceTable balances={this.state.balances} />
        <br />
        <SendTransactionForm self={this} />
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
