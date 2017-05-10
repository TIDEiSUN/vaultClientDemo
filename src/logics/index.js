// import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/build/tidepay-lib';
import { VaultClientClass, TidePayAPIClass, Utils, Errors } from '../../externals/tidepay-lib/src/';
import Config from './config';

const VaultClient = new VaultClientClass(Config.isunpayrpcURL);
const TidePayAPI = new TidePayAPIClass(Config.isunpayrpcURL);

export {
  VaultClient,
  TidePayAPI,
  Config,
  Utils,
  Errors,
};
