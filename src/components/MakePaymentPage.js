import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import { RippleClient } from '../logics';
import UnlockButton from './common/UnlockButton';

function ExchangeForm(props) {
  const {
    secret,
    self,
  } = props;

  if (!secret) {
    return null;
  }

  return (
    <div>
      <h1>Exchange</h1>
      <form>
        <div>
          Rate: {self.state.exchangeRate}
        </div>
        <div>
          From:
          <input type="text" value={self.state.exchangeFromValue} onChange={self.handleChange.bind(self, 'exchangeFromValue')} />
          {self.state.exchangeFromCurrency}
        </div>
        <div>
          To:
          {self.state.exchangeFromValue / self.state.exchangeRate}
          {self.state.exchangeToCurrency}
        </div>
        <AsyncButton
          type="button"
          onClick={self.handleSubmitExchangeForm}
          pendingText="Sending..."
          fulFilledText="Sent"
          rejectedText="Failed! Try Again"
          text="Send"
        />
      </form>
    </div>
  );
}

function SendTransactionForm(props) {
  const {
    secret,
    self,
  } = props;

  if (!secret) {
    return null;
  }

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
        <td>{balance.balance}</td>
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
      exchangeFromCurrency: 'RGP',
      exchangeFromValue: '',
      exchangeToCurrency: 'USD',
      exchangeRate: 200,
    };
    this.handleSubmitPaymentForm = this.handleSubmitPaymentForm.bind(this);
    this.handleSubmitExchangeForm = this.handleSubmitExchangeForm.bind(this);
    this.onUpdate = this.onUpdate.bind(this);

    RippleClient.getAccountBalances(this.state.public)
      .then((balances) => {
        this.setState({
          balances: balances.lines,
        });
      })
      .catch((err) => {
        console.log('getAccountBalances', err)
      });
  }

  onUpdate(data) {
    this.setState(data);
  }

  handleSubmitPaymentForm() {
    console.log('Handle send payment');
    RippleClient.getGatewayAddress()
      .then((v) => {
        const gatewayAddress = v.gateway;
        const external = this.state.externalPayment;
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };
        const destination = this.state.destination;
        const currency = this.state.currency;
        const value = this.state.value;
        let paymentPromise;
        if (external) {
          let memo;
          if (currency === 'RGP') {
            // TODO add UI to input these data
            memo = {
              method: 'create_view',
              params: {
                vid: 'sod1',
                vtime: '1490292663',
                userid: 'isp',
              },
              notifyURI: '',
            };
          } else {
            memo = {
              method: 'send_crypto',
              params: {
                address: destination,
              },
              notifyURI: '',
            };
          }
          paymentPromise = RippleClient.sendExternalPayment(gatewayAddress, sourceAccount, currency, value, memo);
        } else {
          paymentPromise = RippleClient.sendInternalPayment(gatewayAddress, sourceAccount, destination, currency, value);
        }

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

  handleSubmitExchangeForm() {
      console.log('Handle exchange');
      return RippleClient.getGatewayAddress()
        .then((value) => {
          const gatewayAddress = value.gateway;
          const account = {
            address: this.state.public,
            secret: this.state.secret,
          };
          const {
            exchangeFromCurrency: fromCurrency,
            exchangeFromValue: fromValue,
            exchangeToCurrency: toCurrency,
            exchangeRate,
          } = this.state;
          return RippleClient.exchangeCurrency(gatewayAddress, account, fromCurrency, fromValue, toCurrency, exchangeRate);
        })
        .then((result) => {
          console.log('Exchange currency:', result);
          alert('Success!');
        })
        .catch((err) => {
          console.error('Exchange currency:', err);
          alert('Failed!' + err.message);
        });
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  render() {
    return (
      <div className="home">
        <h1>Ripple Account Info</h1>
        <UnlockButton public={this.state.public} secret={this.state.secret} onUpdate={this.onUpdate} />
        <br />
        <AccountBalanceTable balances={this.state.balances} />
        <br />
        <SendTransactionForm secret={this.state.secret} self={this} />
        <br />
        <ExchangeForm secret={this.state.secret} self={this} />
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
