// import { VaultClientClass, TidePayAPIClass, VCUtils, Errors } from '../../externals/tidepay-lib/build/tidepay-lib';
import ms from 'ms';
import { browserHistory } from 'react-router';
import { VaultClientClass, TidePayAPIClass, VCUtils, Errors } from '../../externals/tidepay-lib/src/';
import Config from './config';
import { CurrentLogin } from '../components/Data';

let logoutTimer = null;
const idleTimeLength = '10m';

const callbacks = {
  readLoginToken() {
    console.log('readLoginToken', CurrentLogin.loginToken);
    return Promise.resolve(CurrentLogin.loginToken);
  },
  writeLoginToken(token) {
    console.log('writeLoginToken', token);
    CurrentLogin.loginToken = token;
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
    if (token) {
      logoutTimer = setTimeout(() => {
        alert('Time out!');
        browserHistory.push('/');
      }, ms(idleTimeLength));
    }
    return Promise.resolve();
  },
  readCustomKeys() {
    console.log('readCustomKeys', CurrentLogin.customKeys);
    return Promise.resolve(CurrentLogin.customKeys);
  },
  writeCustomKeys(customKeys) {
    console.log('writeCustomKeys', customKeys);
    CurrentLogin.customKeys = customKeys;
    return Promise.resolve();
  },
};

const VaultClient = new VaultClientClass(Config.isunpayrpcURL, callbacks);
const TidePayAPI = new TidePayAPIClass(Config.isunpayrpcURL);

VCUtils.makeCancelable = (promise) => {
  let hasCancaled = false;
  const wrappedPromise = new Promise((resolve, reject) => {
    promise
    .then((val) => {
      return hasCancaled ? reject({ isCanceled: true }) : resolve(val);
    })
    .catch((err) => {
      return hasCancaled ? reject({ isCanceled: true }) : reject(err);
    });
  });
  return {
    promise: wrappedPromise,
    cancel() {
      hasCancaled = true;
    },
  };
};

const VaultClientStorage = callbacks;

export {
  VaultClient,
  TidePayAPI,
  Config,
  VCUtils,
  Errors,
  VaultClientStorage,
};
