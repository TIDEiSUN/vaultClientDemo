// import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/build/tidepay-lib';
import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/src/';
import Config from './config';

const VaultClient = new VaultClientClass(Config.isunpayrpcURL);
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
