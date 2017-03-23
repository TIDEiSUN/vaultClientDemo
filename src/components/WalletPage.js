import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import { RippleClient } from '../logics';
import UnlockButton from './common/UnlockButton';
import DropdownMenu from './common/DropdownMenu';

function WalletTable(props) {
  const { secret, pockets, self } = props;
  const noSecret = secret === undefined;

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

  return (
    <form>
      <div>
        Activate pocket:
        <DropdownMenu items={self.state.supportedCurrencies} onChange={self.handleNewPocketCurrencyChange} />
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
      public: CurrentLogin.loginInfo.blob.data.account_id,
      secret: CurrentLogin.loginInfo.secret,
      pockets: [],
      newPocketCurrency: '',
      supportedCurrencies: [],
    };
    this.handleActivatePocket = this.handleActivatePocket.bind(this);
    this.handleFreezePocket = this.handleFreezePocket.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.handleNewPocketCurrencyChange = this.handleNewPocketCurrencyChange.bind(this);

    // get all supported currencies
    RippleClient.getCurrencies()
      .then((currencies) => {
        this.setState({ supportedCurrencies: currencies });
      })
      .catch((err) => {
        console.error('Get supported currencies', err);
        alert('Failed to get supported currencies');
      });

    // get all pockets
    const address = CurrentLogin.loginInfo.blob.data.account_id;
    RippleClient.getGatewayAddresses()
      .then((addresses) => {
        return RippleClient.getPockets(addresses[0], address)
      })
      .then((pockets) => {
        console.log('get pockets', pockets);
        this.setState({ pockets });
      })
      .catch((err) => {
        console.error('Get pockets', err);
        alert('Failed to get pockets');
      });
  }

  handleNewPocketCurrencyChange(currency) {
    this.setState({ newPocketCurrency: currency });
  }

  handleActivatePocket(event) {
    console.log('Handle activate pocket');

    return RippleClient.getGatewayAddresses()
      .then((gatewayAddresses) => {
        const gatewayAddress = gatewayAddresses[0];
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };
        const currency = this.state.newPocketCurrency;

        console.log('sourceAccount', sourceAccount);
        console.log('gateway', gatewayAddress);
        console.log('currency', currency);
        // return Promise.resolve({ currency, coinAddress: 'hahaha' });
        return RippleClient.setPocket(gatewayAddress, sourceAccount, currency);
      })
      .then((result) => {
        console.log('activate pocket', result);
        const pockets = {
          ...this.state.pockets,
          [result.currency]: result.coinAddress,
        };
        this.setState({ pockets });
        alert('Pocket activated!');
      }).catch(err => {
        console.error('activate pocket:', err);
        alert('Failed to activate pocket: ' + err.message);
        throw err;
      });

    //event.preventDefault();
  }

  handleFreezePocket(value) {
    const currency = value;
    console.log('Handle freeze pocket', currency);

    return RippleClient.getGatewayAddresses()
      .then((gatewayAddresses) => {
        const gatewayAddress = gatewayAddresses[0];
        const sourceAccount = {
          address: this.state.public,
          secret: this.state.secret,
        };

        console.log('sourceAccount', sourceAccount);
        console.log('gateway', gatewayAddress);
        console.log('currency', currency);
        return RippleClient.setPocket(gatewayAddress, sourceAccount, currency, true);
      })
      .then((result) => {
        console.log('freeze pocket', result);
        const pockets = {
          ...this.state.pockets,
        };
        delete pockets[currency];
        this.setState({ pockets });
        alert('Pocket frozen!');
      }).catch(err => {
        console.error('freeze pocket:', err);
        alert('Failed to freeze pocket: ' + err.message);
        throw err;
      });

    //event.preventDefault();
  }

  onUpdate(data) {
    this.setState(data);
  }

  render() {
    return (
      <div className="home">
        <h1>Wallet</h1>
        <UnlockButton public={this.state.public} secret={this.state.secret} onUpdate={this.onUpdate} />
        <br />
        <WalletTable pockets={this.state.pockets} secret={this.state.secret} self={this} />
        <br />
        <AddWalletForm secret={this.state.secret} self={this} />
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
