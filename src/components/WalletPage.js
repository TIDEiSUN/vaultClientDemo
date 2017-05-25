import React from 'react';
import { Link } from 'react-router';
import AsyncButton from './common/AsyncButton';
import { VaultClient, TidePayAPI, Utils } from '../logics';
import UnlockButton from './common/UnlockButton';
import DropdownMenu from './common/DropdownMenu';

function WalletTable(props) {
  const { secret, pockets, self } = props;
  const noSecret = !secret;

  const rows = [];
  Object.keys(pockets).forEach((currency) => {
    rows.push(
      <tr key={currency}>
        <td>{currency}</td>
        <td>{pockets[currency]}</td>
        <td>
          <AsyncButton
            type="button"
            disabled={noSecret}
            onClick={self.handleFreezePocket}
            pendingText="Freezing..."
            fulFilledText="Frozen"
            rejectedText="Failed! Try Again"
            text="Freeze"
            eventValue={currency}
          />
        </td>
      </tr>
    );
  });

  if (rows.length === 0) {
    return (
      <div>
        No pocket!
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <td>Currency</td>
          <td>Top Up Address</td>
          <td>Freeze</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function AddWalletForm(props) {
  const {
    secret,
    self,
  } = props;

  if (!secret) {
    return null;
  }

  const currencies = self.state.supportedCurrencies.filter(currency => self.state.pockets[currency] === undefined);

  return (
    <form>
      <div>
        Activate pocket:
        <DropdownMenu items={currencies} onChange={self.handleNewPocketCurrencyChange} />
        <AsyncButton
          type="button"
          onClick={self.handleActivatePocket}
          pendingText="Activating..."
          fulFilledText="Activated"
          rejectedText="Failed! Try Again"
          text="Activate"
        />
      </div>
    </form>
  );
}

export default class WalletPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      public: null,
      secret: null,
      hasPaymentPin: null,
      unlockSecret: null,
      pockets: [],
      newPocketCurrency: '',
      supportedCurrencies: [],
    };
    this.handleActivatePocket = this.handleActivatePocket.bind(this);
    this.handleFreezePocket = this.handleFreezePocket.bind(this);
    this.onUnlock = this.onUnlock.bind(this);
    this.handleNewPocketCurrencyChange = this.handleNewPocketCurrencyChange.bind(this);
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          const address = blob.data.account_id;
          this.setState({
            public: address,
            hasPaymentPin: blob.has_payment_pin,
            unlockSecret: blob.data.unlock_secret,
          });
          return address;
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get tidepay address');
        });
    };
    const getAllSupportedCurrencies = () => {
      return TidePayAPI.getCurrencies()
        .then((value) => {
          this.setState({ supportedCurrencies: value.currencies });
        })
        .catch((err) => {
          console.error('Get supported currencies', err);
          alert('Failed to get supported currencies');
        });
    };
    const getAllPockets = (address) => {
      return TidePayAPI.getGatewayAddress()
        .then((value) => {
          return TidePayAPI.getAccountPockets(value.gateway, address);
        })
        .then((pockets) => {
          console.log('get pockets', pockets);
          this.setState({ pockets });
        })
        .catch((err) => {
          console.error('Get pockets', err);
          alert('Failed to get pockets');
        });
    };
    const promise = getLoginInfo()
      .then(address => getAllPockets(address))
      .then(() => getAllSupportedCurrencies());
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleNewPocketCurrencyChange(currency) {
    this.setState({ newPocketCurrency: currency });
  }

  handleActivatePocket(event) {
    console.log('Handle activate pocket');

    return TidePayAPI.getGatewayAddress()
      .then((value) => {
        const gatewayAddress = value.gateway;
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };
        const currency = this.state.newPocketCurrency;

        console.log('sourceAccount', sourceAccount);
        console.log('gateway', gatewayAddress);
        console.log('currency', currency);
        // return Promise.resolve({ currency, coinAddress: 'hahaha' });
        return TidePayAPI.setPocket(sourceAccount, currency);
      })
      .then((result) => {
        console.log('activate pocket', result);
        const pockets = {
          ...this.state.pockets,
          [result.currency]: result.coinAddress,
        };
        this.setState({ pockets });
        alert('Pocket activated!');
        return Promise.resolve();
      }).catch(err => {
        console.error('activate pocket:', err);
        alert('Failed to activate pocket: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleFreezePocket(value) {
    const currency = value;
    console.log('Handle freeze pocket', currency);

    return TidePayAPI.getGatewayAddress()
      .then((value) => {
        const gatewayAddress = value.gateway;
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };

        console.log('sourceAccount', sourceAccount);
        console.log('gateway', gatewayAddress);
        console.log('currency', currency);
        return TidePayAPI.setPocket(sourceAccount, currency, true);
      })
      .then((result) => {
        console.log('freeze pocket', result);
        const pockets = {
          ...this.state.pockets,
        };
        delete pockets[currency];
        this.setState({ pockets });
        alert('Pocket frozen!');
        return Promise.resolve();
      }).catch(err => {
        console.error('freeze pocket:', err);
        alert('Failed to freeze pocket: ' + err.message);
        return Promise.reject(err);
      });
  }

  onUnlock(data) {
    const { secret } = data;
    this.setState({ secret });
  }

  render() {
    let childComponents = null;
    if (this.state.public) {
      childComponents = (
        <div>
          <UnlockButton address={this.state.public} secret={this.state.secret} hasPaymentPin={this.state.hasPaymentPin} unlockSecret={this.state.unlockSecret} onUnlock={this.onUnlock} />
          <br />
          <WalletTable pockets={this.state.pockets} secret={this.state.secret} self={this} />
          <br />
          <AddWalletForm secret={this.state.secret} self={this} />
        </div>
      );
    }
    return (
      <div className="home">
        <h1>Wallet</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
