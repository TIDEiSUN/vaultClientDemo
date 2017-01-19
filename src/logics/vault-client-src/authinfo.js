import * as superagent from 'superagent';
import { RippleTxt } from './rippletxt';

class SuperAgentHelper {
  static getRequest(url) {
    return new Promise((resolve, reject) => {
      superagent.get(url, (err, res) => {
        if (err || res.error) {
          reject(new Error('Authentication info server unreachable'));
        } else {
          resolve(res.body);
        }
      });
    });
  }
}

export default class AuthInfo {
  /**
   * Get auth info for a given username or ripple address
   *
   * @param {string}    domain - Domain which hosts the user's info
   * @param {string}    address - Username or ripple address who's info we are retreiving
   */

  static get(domain, address) {
    const resolveAuthInfoURL = (txt) => {
      if (!txt.authinfo_url) {
        return Promise.reject(new Error(`Authentication is not supported on ${domain}`));
      }
      // TODO check if domain is needed in query string
      let url = Array.isArray(txt.authinfo_url) ? txt.authinfo_url[0] : txt.authinfo_url;
      url += `?domain=${domain}&username=${address}`;
      return Promise.resolve(url);
    };

    return RippleTxt.get(domain)
      .then(resolveAuthInfoURL)
      .then(SuperAgentHelper.getRequest);
  }

  /**
   * Get auth info for a given address
   *
   * @param {string}    domain - Domain which hosts the user's info
   * @param {string}    address - Address of user who's info we are retreiving
   */

  // TODO rename to getAddress
  // TODO remove this function
  static getAddress(domain, address) {
    return AuthInfo.get(domain, address);
  }
}
