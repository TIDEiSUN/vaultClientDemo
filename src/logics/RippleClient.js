import { RippleAPI } from 'ripple-lib';
import Config from './config';
import RippleTxt from './vault-client-src/rippletxt';

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
}

const RippleClient = new RippleClientClass();
export default RippleClient;
