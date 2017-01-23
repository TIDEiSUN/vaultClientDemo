import request from 'superagent';
import { Currency } from 'ripple-lib';

var RippleTxt = {
  txts : { }
};

RippleTxt.urlTemplates = [
  'https://{{domain}}/ripple.txt',
  'https://www.{{domain}}/ripple.txt',
  'https://ripple.{{domain}}/ripple.txt',
  'http://{{domain}}/ripple.txt',
  'http://www.{{domain}}/ripple.txt',
  'http://ripple.{{domain}}/ripple.txt'
];

/**
 * Gets the ripple.txt file for the given domain
 * @param {string}    domain - Domain to retrieve file from
 * @param {function}  fn - Callback function
 */

RippleTxt.get = function(domain) {
  return new Promise((resolve, reject) => {
    var self = this;

    if (self.txts[domain]) {
      resolve(self.txts[domain]);
      return;
    }

    ;(function nextUrl(i) {
      var url = RippleTxt.urlTemplates[i];

      if (!url) {
        reject(new Error('No ripple.txt found'));
        return;
      }

      url = url.replace('{{domain}}', domain);
      console.log(url);
      
      request.get(url, function(err, resp) {
        if (err || !resp.text) {
          nextUrl(++i);
          return;
        }

        var sections = self.parse(resp.text);
        self.txts[domain] = sections;

        resolve(sections);
      });
    })(0);
  });
};

/**
 * Parse a ripple.txt file
 * @param {string}  txt - Unparsed ripple.txt data
 */

RippleTxt.parse = function(txt) {
  var currentSection = '';
  var sections = { };
  
  txt = txt.replace(/\r?\n/g, '\n').split('\n');

  for (var i = 0, l = txt.length; i < l; i++) {
    var line = txt[i];

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
};

/**
 * extractDomain
 * attempt to extract the domain from a given url
 * returns the url if unsuccessful
 * @param {Object} url
 */

RippleTxt.extractDomain = function (url) {
  let match = /[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?([^.\?][^\?.]+?)?$/.exec(url);
  return match && match[0] ? match[0] : url;
};

/**
 * getCurrencies
 * returns domain, issuer account and currency object
 * for each currency found in the domain's ripple.txt file
 * @param {Object} domain
 * @param {Object} fn
 */

RippleTxt.getCurrencies = function(domain) {
  var extracted = RippleTxt.extractDomain(domain);
  var self      = this;
  
  function getCurrencies(domain) {
    return self.get(domain)
      .then((txt) => {
        if (!txt.currencies || !txt.accounts) {
          return Promise.resolve([]);
        }
        //NOTE: this won't be accurate if there are
        //multiple issuer accounts with different 
        //currencies associated with each.
        var issuer     = txt.accounts[0];
        var currencies = [];

        txt.currencies.forEach(function(currency) {
          currencies.push({
            issuer   : issuer,
            currency : Currency.from_json(currency),
            domain   : domain
          });
        });

        return Promise.resolve(currencies);
      });
  }
  
  //try with extracted domain
  return getCurrencies(extracted)
    .then(resp => {
      return Promise.resolve(resp);
    }).catch(err => {
      //try with original domain
      return getCurrencies(domain);
    });
}; 

exports.RippleTxt = RippleTxt;
