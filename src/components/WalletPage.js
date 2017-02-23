import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import AsyncButton from './AsyncButton';
import Config from '../logics/config';
import RippleClient from '../logics/RippleClient';
import UnlockButton from './button/UnlockButton';

function WalletTable(props) {
  const pockets = props.pockets;

  const rows = [];
  Object.keys(pockets).forEach((currency) => {
    rows.push(
      <tr>
        <td>{currency}</td>
        <td>{pockets[currency]}</td>
      </tr>
    );
  });

  if (rows.length === 0) {
    return (
      <div>
        No pockets!
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <td>Currency</td>
          <td>Top Up Address</td>
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
        New pocket:
        <input type="text" value={self.state.newPocketCurrency} onChange={self.handleChange.bind(self, 'newPocketCurrency')} />
        <AsyncButton
          type="button"
          onClick={self.handleAddPocket}
          pendingText="Adding..."
          fulFilledText="Added"
          rejectedText="Failed! Try Again"
          text="Add"
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
    this.handleAddPocket = this.handleAddPocket.bind(this);
    this.onUpdate = this.onUpdate.bind(this);

    // get all pockets
    const address = CurrentLogin.loginInfo.blob.data.account_id;
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

  handleAddPocket(event) {
    console.log('Handle add pocket');

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
        return RippleClient.addPocket(gatewayAddress, sourceAccount, currency);
      })
      .then((result) => {
        console.log('add pocket', result);
        const pockets = {
          ...this.pockets,
          [result.currency]: result.coinAddress,
        };
        this.setState({ pockets });
        alert('Pocket added!');
      }).catch(err => {
        console.error('add pocket:', err);
        alert('Failed to add pocket: ' + err.message);
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
        <AddWalletForm secret={this.state.secret} self={this} />
        <br />
        <WalletTable pockets={this.state.pockets} />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
