import React from 'react';
import { Link } from 'react-router';
import { CurrentLogin } from './Data';
import AsyncButton from './common/AsyncButton';
import { RippleClient } from '../logics';
import UnlockButton from './common/UnlockButton';

function WalletTable(props) {
  const { secret, pockets, self } = props;
  const noSecret = secret === undefined;

  const rows = [];
  Object.keys(pockets).forEach((currency) => {
    rows.push(
      <tr>
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
        <input type="text" value={self.state.newPocketCurrency} onChange={self.handleChange.bind(self, 'newPocketCurrency')} />
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
    };
    this.handleActivatePocket = this.handleActivatePocket.bind(this);
    this.handleFreezePocket = this.handleFreezePocket.bind(this);
    this.onUpdate = this.onUpdate.bind(this);

    // get all pockets
    const address = CurrentLogin.loginInfo.blob.data.account_id;
    // const address = 'rMYQpx1dPffj4Tw8MDwSZqPfT9urLZdn6C';
    RippleClient.getPockets(address)
      .then((pockets) => {
        console.log('get pockets', pockets);
        this.setState({ pockets });
      })
      .catch((err) => {
        console.error('Get pockets', err);
      });

    // get ETH pocket
    const currency = 'ETH';
    RippleClient.getPocket(address, currency)
      .then((pocket) => {
        console.log('get ETH pocket', pocket);
      })
      .catch((err) => {
        console.error('Get ETH pockets', err);
      });
  }

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
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
        return RippleClient.setPocket(gatewayAddress, sourceAccount, currency);
      })
      .then((result) => {
        console.log('activate pocket', result);
        const pockets = {
          ...this.pockets,
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
          ...this.pockets,
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
