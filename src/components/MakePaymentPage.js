import React from 'react';
import { Link } from 'react-router';
import AsyncButton from './common/AsyncButton';
import { VaultClient, TidePayAPI, VCUtils as Utils } from '../logics';
import UnlockButton from './common/UnlockButton';
import DropdownMenu from './common/DropdownMenu';
import AccountBalanceTable from './common/AccountBalanceTable';

function WithdrawalFeeTable(props) {
  const {
    secret,
    withdrawalFeeMap,
    currencies,
  } = props;

  if (!secret) {
    return null;
  }

  const rows = [];
  Object.keys(withdrawalFeeMap).forEach((currency) => {
    if (currencies.includes(currency)) {
      rows.push(
        <tr key={currency}>
          <td>{currency}</td>
          <td>{withdrawalFeeMap[currency]}</td>
        </tr>
      );
    }
  });

  if (rows.length === 0) {
    return null;
  }
  return (
    <table>
      <thead>
        <tr>
          <td>Currency</td>
          <td>Fee</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function SendTransactionForm(props) {
  const {
    secret,
    self,
    withdrawalFeeMap,
    currencies,
  } = props;

  if (!secret) {
    return null;
  }

  const withdrawalFee = self.state.currency ? withdrawalFeeMap[self.state.currency] : undefined;
  const fee = self.state.externalPayment ? withdrawalFee : 0;
  const total = self.state.value ? parseFloat(self.state.value) + fee : '';

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
        <DropdownMenu items={currencies} onChange={self.handleCurrencyChange} />
      </div>
      <div>
        Value:
        <input type="text" value={self.state.value} onChange={self.handleChange.bind(self, 'value')} />
      </div>
      <div>
        Total: {total}
      </div>
      <div>
        Note:
        <textarea value={self.state.note} onChange={self.handleChange.bind(self, 'note')} />
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

export default class MakePaymentPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      public: null,
      secret: null,
      hasPaymentPin: null,
      unlockSecret: null,
      balances: {},
      externalPayment: false,
      destination: '',
      currency: '',
      value: '',
      withdrawalFeeMap: {},
      note: '',
    };
    this.handleCurrencyChange = this.handleCurrencyChange.bind(this);
    this.handleSubmitPaymentForm = this.handleSubmitPaymentForm.bind(this);
    this.onUnlock = this.onUnlock.bind(this);
    this.onGetAccountBalances = this.onGetAccountBalances.bind(this);
  }

  componentDidMount() {
    const setResults = ([loginInfo, withdrawalFeeMap]) => {
      const { blob } = loginInfo;
      this.setState({
        public: blob.data.account_id,
        hasPaymentPin: blob.has_payment_pin,
        unlockSecret: blob.data.unlock_secret,
        withdrawalFeeMap,
      });
    };
    const loginInfoPromise = VaultClient.getLoginInfo()
      .catch((err) => {
        console.error('getLoginInfo', err);
        return Promise.reject(err);
      });
    const withdrawalFeePromise = TidePayAPI.getWithdrawalFee()
      .catch((err) => {
        console.log('getTransactionFee', err);
        return Promise.reject(err);
      });
    const promise = Promise.all([
      loginInfoPromise,
      withdrawalFeePromise,
    ]);

    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setResults)
      .catch((err) => {
        if (!(err instanceof Error) && err.isCanceled) {
          return;
        }
        alert('Failed to get tidepay address / account balances');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  onUnlock(secret) {
    this.setState({ secret });
  }

  onGetAccountBalances(balances) {
    this.setState({ balances });
  }

  handleSubmitPaymentForm() {
    console.log('Handle send payment');
    return TidePayAPI.getGatewayAddress()
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
        if (!currency || !value) {
          return Promise.reject('Invalid currency or value');
        }

        const clientMemo = this.state.note;
        let paymentPromise;
        if (external) {
          const fee = this.state.withdrawalFeeMap[currency];
          const total = parseFloat(value) + fee;
          let actionMemo;
          if (currency === 'RGP') {
            // TODO add UI to input these data
            actionMemo = {
              method: 'create_view',
              params: {
                vid: 'sod1',
                vtime: '1490292663',
                userid: 'isp',
              },
              notifyURI: '',
            };
          } else {
            actionMemo = {
              method: 'send_crypto',
              params: {
                address: destination,
                fee,
              },
              notifyURI: '',
            };
          }
          paymentPromise = TidePayAPI.sendExternalPayment(gatewayAddress, sourceAccount, currency, total, actionMemo, clientMemo);
        } else {
          paymentPromise = TidePayAPI.sendInternalPayment(gatewayAddress, sourceAccount, destination, currency, value, clientMemo);
        }

        return paymentPromise;
      })
      .then((result) => {
        console.log('Submit payment', result);
        alert('Success!');
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('Submit payment', err);
        alert('Failed! ' + err.message);
        return Promise.reject(err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  handleCurrencyChange(currency) {
    this.setState({ currency });
  }

  render() {
    let childComponents = null;
    if (this.state.public) {
      const currencies = Object.keys(this.state.balances);
      childComponents = (
        <div>
          <UnlockButton address={this.state.public} secret={this.state.secret} hasPaymentPin={this.state.hasPaymentPin} unlockSecret={this.state.unlockSecret} onUnlock={this.onUnlock} />
          <br />
          <AccountBalanceTable address={this.state.public} onGetAccountBalances={this.onGetAccountBalances} />
          <br />
          <WithdrawalFeeTable secret={this.state.secret} withdrawalFeeMap={this.state.withdrawalFeeMap} currencies={currencies} />
          <br />
          <SendTransactionForm secret={this.state.secret} self={this} withdrawalFeeMap={this.state.withdrawalFeeMap} currencies={currencies} />
        </div>
      );
    }
    return (
      <div className="home">
        <h1>Ripple Account Info</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
