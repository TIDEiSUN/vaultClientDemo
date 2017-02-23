import { RippleAPI } from 'ripple-lib';
import request from 'superagent';
import Config from './config';
import RippleTxt from './vault-client-src/rippletxt';

function sendPayment(api, sourceAccount, payment) {
  return api.preparePayment(sourceAccount.address, payment)
    .then((prepared) => {
      const signedData = api.sign(prepared.txJSON, sourceAccount.secret);

      const config = {
        method : 'POST',
        url    : `${Config.isunpayrpcURL}/signedTransaction`,
        data   : {
          signed: signedData,
          maxLedgerVersion: prepared.instructions.maxLedgerVersion,
        },
      };

      return new Promise((resolve, reject) => {
        request.post(config.url)
          .send(config.data)
          .end((err, resp) => {
            if (err) {
              reject(err);
            } else if (!resp.ok) {
              console.log(resp);
              reject(new Error(resp.body.message));
            } else {
              resolve(resp.body);
            }
          });
      });
    });
}

class RippleClientClass {
  constructor() {
    this.domain = Config.rippleTxtDomain;

    this.api = new RippleAPI({ server: Config.rippleRPC });

    this.api.on('error', (errorCode, errorMessage) => {
        console.log(errorCode + ': ' + errorMessage);
    });
    this.api.on('connected', () => {
        console.log('connected');
    });
    this.api.on('disconnected', (code) => {
        // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
        // will be 1000 if this was normal closure
        console.log('disconnected, code:', code);
    });
  }

  connectToServer() {
    return this.api.connect().catch(console.error);
  }

  disconnectToServer() {
    return this.api.disconnect();
  }

  getGatewayAddresses() {
    return RippleTxt.getAccounts(this.domain);
  }

  getCurrencies() {
    return RippleTxt.getCurrencies(this.domain);
  }

  getBalances(address) {
    return this.api.getBalances(address).catch(console.error);
  }

  sendInternalPayment(gatewayAddress, sourceAccount, destinationRippleAddress, currency, value) {
    const amount = {
      currency,
      value,
      counterparty: gatewayAddress,
    };
    const payment = {
      source: {
        address: sourceAccount.address,
        maxAmount: amount,
      },
      destination: {
        address: destinationRippleAddress,
        amount: amount,
      },
    };
    return sendPayment(this.api, sourceAccount, payment);
  }

  sendExternalPayment(gatewayAddress, sourceAccount, destinationCoinAddress, currency, value) {
    const amount = {
      currency,
      value,
      counterparty: gatewayAddress,
    };
    const memo = {
      coinAddress: destinationCoinAddress,
    };
    const payment = {
      source: {
        address: sourceAccount.address,
        maxAmount: amount,
      },
      destination: {
        address: gatewayAddress,
        amount: amount,
      },
      memos: [{
        data: JSON.stringify(memo),
        format: 'application/JSON',
      }],
    };
    return sendPayment(this.api, sourceAccount, payment);
  }
}

const RippleClient = new RippleClientClass();
export default RippleClient;
