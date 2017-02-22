import request from 'superagent';

class RippleTxtClass {
  constructor() {
    this.txts = {};
    this.urlTemplates = [
      'https://{{domain}}/ripple.txt',
      'https://www.{{domain}}/ripple.txt',
      'https://ripple.{{domain}}/ripple.txt',
      'http://{{domain}}/ripple.txt',
      'http://www.{{domain}}/ripple.txt',
      'http://ripple.{{domain}}/ripple.txt',
    ];
  }

  /**
   * Gets the ripple.txt file for the given domain
   * @param {string}    domain - Domain to retrieve file from
   */

  get(domain) {
    return new Promise((resolve, reject) => {
      const self = this;

      if (self.txts[domain]) {
        resolve(self.txts[domain]);
        return;
      }

      ;(function nextUrl(i) {
        let url = self.urlTemplates[i];

        if (!url) {
          reject(new Error('No ripple.txt found'));
          return;
        }

        url = url.replace('{{domain}}', domain);
        // console.log(url);

        request.get(url, (err, resp) => {
          if (err || !resp.text) {
            nextUrl(++i);
            return;
          }

          const sections = self.parse(resp.text);
          self.txts[domain] = sections;

          resolve(sections);
        });
      })(0);
    });
  }

  /**
   * Parse a ripple.txt file
   * @param {string}  txt - Unparsed ripple.txt data
   */

  parse(txt) {
    let currentSection = '';
    const sections = { };

    txt = txt.replace(/\r?\n/g, '\n').split('\n');

    for (let i = 0, l = txt.length; i < l; i++) {
      let line = txt[i];

      if (!line.length || line[0] === '#') {
        continue;
      }

      if (line[0] === '[' && line[line.length - 1] === ']') {
        currentSection = line.slice(1, line.length - 1);
        sections[currentSection] = [];
      } else {
        line = line.replace(/^\s+|\s+$/g, '');
        if (sections[currentSection]) {
          sections[currentSection].push(line);
        }
      }
    }

    return sections;
  }

  /**
   * extractDomain
   * attempt to extract the domain from a given url
   * returns the url if unsuccessful
   * @param {Object} url
   */

  extractDomain(url) {
    const match = /[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?([^.\?][^\?.]+?)?$/.exec(url);
    return match && match[0] ? match[0] : url;
  }


  /**
   * getAccounts
   * returns issuer account
   * for each accounts found in the domain's ripple.txt file
   * @param {Object} domain
   */

  getAccounts(domain) {
    const extracted = this.extractDomain(domain);
    const self      = this;

    function getAccounts(domain) {
      return self.get(domain)
        .then((txt) => {
          if (!txt.accounts) {
            return Promise.resolve([]);
          }
          return Promise.resolve(txt.accounts);
        });
    }

    // try with extracted domain
    return getAccounts(extracted)
      .then((resp) => {
        return Promise.resolve(resp);
      }).catch((err) => {
        // try with original domain
        return getAccounts(domain);
      });
  }
  
  /**
   * getCurrencies
   * returns currency
   * for each currency found in the domain's ripple.txt file
   * @param {Object} domain
   */

  getCurrencies(domain) {
    const extracted = this.extractDomain(domain);
    const self      = this;

    function getCurrencies(domain) {
      return self.get(domain)
        .then((txt) => {
          if (!txt.currencies) {
            return Promise.resolve([]);
          }
          return Promise.resolve(txt.currencies);
        });
    }

    // try with extracted domain
    return getCurrencies(extracted)
      .then((resp) => {
        return Promise.resolve(resp);
      }).catch((err) => {
        // try with original domain
        return getCurrencies(domain);
      });
  }
}

const RippleTxt = new RippleTxtClass();
export default RippleTxt;
