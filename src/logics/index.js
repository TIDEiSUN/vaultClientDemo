import VaultClientClass, { Utils, Errors } from '../../isunpayweb/app/logics/vault-client-src/VaultClient';
import TidePayAPIClass from '../../isunpayweb/app/logics/tidepay-lib-src/TidePayAPI';
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
