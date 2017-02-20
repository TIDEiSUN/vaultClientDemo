import { RippleAPI } from 'ripple-lib';
import Config from './config';

class RippleClientClass {
  constructor() {
    console.log('RippleClientClass constructor');
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
}

const RippleClient = new RippleClientClass();
export default RippleClient;
