import { VaultClientClass, Utils, Errors } from '../../externals/tidepay-lib/build/tidepay-lib';
import { TidePayAPIClass } from '../../externals/tidepay-lib/build/tidepay-lib';
import Config from './config';

const VaultClient = new VaultClientClass(Config.isunpayrpcURL);
const TidePayAPI = new TidePayAPIClass(Config.isunpayrpcURL);

export default {
  VaultClient,
  TidePayAPI,
  Config,
  Utils,
  Errors,
};

export {
  VaultClient,
  TidePayAPI,
  Config,
  Utils,
  Errors,
};
