// import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/build/tidepay-lib';
import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/src/';
import Config from './config';
import { CurrentLogin } from '../components/Data';

const callbacks = {
  readLoginToken() {
    console.log('readLoginToken', CurrentLogin.loginToken);
    return CurrentLogin.loginToken;
  },
  writeLoginToken(token) {
    console.log('writeLoginToken', token);
    CurrentLogin.loginToken = token;
  },
  readCustomKeys() {
    console.log('readCustomKeys', CurrentLogin.customKeys);
    return CurrentLogin.customKeys;
  },
  writeCustomKeys(customKeys) {
    console.log('writeCustomKeys', customKeys);
    CurrentLogin.customKeys = customKeys;
  },
};

const VaultClient = new VaultClientClass(Config.isunpayrpcURL, callbacks);
const TidePayAPI = new TidePayAPIClass(Config.isunpayrpcURL);

Utils.makeCancelable = (promise) => {
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

export {
  VaultClient,
  TidePayAPI,
  Config,
  Utils,
  Errors,
};
