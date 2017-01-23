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

export default {
  /**
   * Get auth info for a given username or ripple address
   *
   * @param {string}    domain - Domain to request ripple.txt
   * @param {string}    address - Username or ripple address who's info we are retreiving
   */

  get(domain, address) {
    const resolveAuthInfoURL = (txt) => {
      if (!txt.authinfo_url) {
        return Promise.reject(new Error(`Authentication is not supported on ${domain}`));
      }
      let url = Array.isArray(txt.authinfo_url) ? txt.authinfo_url[0] : txt.authinfo_url;
      url += `?username=${address}`;
      return Promise.resolve(url);
    };

    return RippleTxt.get(domain)
      .then(resolveAuthInfoURL)
      .then(SuperAgentHelper.getRequest);
  },
};
