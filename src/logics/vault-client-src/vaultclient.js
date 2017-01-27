import blobClient, { Blob } from './blob';
import AuthInfo from './authinfo';
import RippleTxt from './rippletxt';
import crypt from './crypt';

class DeriveHelper {
  /**
   * deriveLoginKeys
   */
  static deriveLoginKeys(authInfo, password) {
    const normalizedUsername = authInfo.username.toLowerCase().replace(/-/g, '');

    // derive login keys
    return crypt.derive(authInfo.pakdf, 'login', normalizedUsername, password)
      .then(keys => Promise.resolve({ authInfo, password, keys }));
  }

  /**
   * deriveUnlockKey
   */
  static deriveUnlockKey(authInfo, password, keys = {}) {
    const normalizedUsername = authInfo.username.toLowerCase().replace(/-/g, '');

    // derive unlock key
    return crypt.derive(authInfo.pakdf, 'unlock', normalizedUsername, password)
      .then((unlock) => {
        const mergedKeys = { ...keys, unlock: unlock.unlock };
        return Promise.resolve({ authInfo, keys: mergedKeys });
      });
  }
}

export default class VaultClient {
  constructor(opts = {}) {
    const domain = typeof opts === 'string' ? opts : opts.domain;
    this.domain = domain || 'ripple.com';
    this.infos = {};
  }

  /**
   * getAuthInfo
   * gets auth info for a username. returns authinfo
   * even if user does not exists (with exist set to false)
   * @param {string} username
   * @param {function} callback
   */
  getAuthInfo(username) {
    return AuthInfo.get(this.domain, username).then((authInfo) => {
      if (authInfo.version !== 3) {
        return Promise.reject(new Error('This wallet is incompatible with this version of the vault-client.'));
      }

      if (!authInfo.pakdf) {
        return Promise.reject(new Error('No settings for PAKDF in auth packet.'));
      }

      if (typeof authInfo.blobvault !== 'string') {
        return Promise.reject(new Error('No blobvault specified in the authinfo.'));
      }

      return Promise.resolve(authInfo);
    });
  }

  /**
   * Get a ripple name from a given account address, if it has one
   * @param {string} address - Account address to query
   * @param {string} url     - Url of blob vault
   */

  getRippleName(address, url) {
    // use the url from previously retrieved authInfo, if necessary
    if (!url) {
      return Promise.reject(new Error('Blob vault URL is required'));
    }
    return blobClient.getRippleName(url, address);
  }

  /**
   * Check blobvault for existance of username
   *
   * @param {string}    username
   * @param {function}  fn - Callback function
   */

  exists(username) {
    return AuthInfo.get(this.domain, username)
      .then(authInfo => Promise.resolve(!!authInfo.exists));
  }

  /**
   * Check blobvault for existance of address
   *
   * @param {string}    address
   * @param {function}  fn - Callback function
   */

  addressExists(address) {
    return AuthInfo.get(this.domain, address)
      .then(authInfo => Promise.resolve(!!authInfo.exists));
  }

  /**
   * Authenticate and retrieve a decrypted blob using a ripple name and password
   *
   * @param {string}    username
   * @param {string}    password
   * @param {function}  fn - Callback function
   */

  login(username, password, device_id) {
    const checkExists = (authInfo) => {
      if (authInfo && !authInfo.exists) {
        return Promise.reject(new Error('User does not exists.'));
      }
      return Promise.resolve({ authInfo, password });
    };

    const getBlob = (authInfo, password, keys) => {
      const options = {
        url: authInfo.blobvault,
        blob_id: keys.id,
        key: keys.crypt,
        device_id: device_id,
      };
      return blobClient.get(options);
    };

    const updateKeys = (authInfo, keys, blob) => {
      if (!keys.unlock) {
        // unable to unlock
        return;
      }

      let secret;
      try {
        secret = crypt.decrypt(keys.unlock, blob.encrypted_secret);
      } catch (error) {
        console.log('error:', 'decrypt:', error);
        return;
      }

      const options = {
        username: authInfo.username,
        blob: blob,
        masterkey: secret,
        keys: keys,
      };

      blobClient.updateKeys(options)
        .then((resp) => {
          // do nothing
        }).catch((err) => {
          console.log('error:', 'updateKeys:', err);
        });
    };

    const processBlob = (authInfo, password, keys, blob) => {
      // save for relogin
      this.infos[keys.id] = authInfo;

      // migrate missing fields
      if (blob.missing_fields) {
        if (blob.missing_fields.encrypted_blobdecrypt_key) {
          console.log('migration: saving encrypted blob decrypt key');
          // get the key to unlock the secret, then update the blob keys
          DeriveHelper.deriveUnlockKey(authInfo, password, keys)
            .then((result) => {
              updateKeys(result.authInfo, result.keys, blob);
            })
            .catch((err) => {
              // unable to unlock
            });
        }
      }

      return Promise.resolve({
        blob: blob,
        username: authInfo.username,
        verified: authInfo.emailVerified, // DEPRECIATE
        emailVerified: authInfo.emailVerified,
        profileVerified: authInfo.profile_verified,
        identityVerified: authInfo.identity_verified,
      });
    };

    const loginKeysPromise = this.getAuthInfo(username)
      .then(checkExists)
      .then(result => DeriveHelper.deriveLoginKeys(result.authInfo, result.password));

    const blobPromise = loginKeysPromise
      .then(result => getBlob(result.authInfo, result.password, result.keys));

    return Promise.all([loginKeysPromise, blobPromise])
      .then(results => processBlob(results[0].authInfo, results[0].password, results[0].keys, results[1]));
  }

  /**
   * Retreive and decrypt blob using a blob url, id and crypt derived previously.
   *
   * @param {string}   url - Blob vault url
   * @param {string}   id  - Blob id from previously retreived blob
   * @param {string}   key - Blob decryption key
   * @param {function} fn  - Callback function
   */

  relogin(url, id, key, device_id) {
    // use the url from previously retrieved authInfo, if necessary
    if (!url && this.infos[id]) {
      url = this.infos[id].blobvault;
    }

    if (!url) {
      return Promise.reject(new Error('Blob vault URL is required'));
    }

    var options = {
      url: url,
      blob_id: id,
      key: key,
      device_id: device_id,
    };

    return blobClient.get(options)
      .then(blob => Promise.resolve({blob}));
  }

  /**
   * Decrypt the secret key using a username and password
   *
   * @param {string}    username
   * @param {string}    password
   * @param {string}    encryptSecret
   * @param {function}  fn - Callback function
   */

  unlock(username, password, encryptSecret) {
    const checkExists = (authInfo) => {
      if (authInfo && !authInfo.exists) {
        return Promise.reject(new Error('User does not exists.'));
      }
      return Promise.resolve({ authInfo, password });
    };

    const unlockSecret = (authInfo, keys) => {
      var secret;
      try {
        secret = crypt.decrypt(keys.unlock, encryptSecret);
      } catch (error) {
        return Promise.reject(error);
      }
      return Promise.resolve({
        keys,
        secret,
      });
    };

    return this.getAuthInfo(username)
      .then(checkExists)
      .then(result => DeriveHelper.deriveUnlockKey(result.authInfo, result.password))
      .then(result => unlockSecret(result.authInfo, result.keys));
  }

  /**
   * Retrieve the decrypted blob and secret key in one step using
   * the username and password
   *
   * @param {string}    username
   * @param {string}    password
   * @param {function}  fn - Callback function
   */

  loginAndUnlock(username, password, device_id) {
    const postLogin = (resp) => {
        if (!resp.blob || !resp.blob.encrypted_secret) {
          return Promise.reject(new Error('Unable to retrieve blob and secret.'));
        }

        if (!resp.blob.id || !resp.blob.key) {
          return Promise.reject(new Error('Unable to retrieve keys.'));
        }

        // get authInfo via id - would have been saved from login
        var authInfo = this.infos[resp.blob.id];

        if (!authInfo) {
          return Promise.reject(new Error('Unable to find authInfo'));
        }

        return Promise.resolve({ authInfo, password, blob: resp.blob });
    };

    let unlockSecret = (unlock, authInfo, blob) => {
      var secret;
      try {
        secret = crypt.decrypt(unlock, blob.encrypted_secret);
      } catch (error) {
        return Promise.reject(error);
      }

      return Promise.resolve({
        blob: blob,
        unlock: unlock,
        secret: secret,
        username: authInfo.username,
        verified: authInfo.emailVerified, // DEPRECIATE
        emailVerified: authInfo.emailVerified,
        profileVerified: authInfo.profile_verified,
        identityVerified: authInfo.identity_verified,
      });
    };

    let loginPromise = this.login(username, password, device_id)
      .then(postLogin);

    let unlockKeyPromise = loginPromise
      .then(result => DeriveHelper.deriveUnlockKey(result.authInfo, result.password));

    return Promise.all([loginPromise, unlockKeyPromise])
      .then(results => unlockSecret(results[1].keys.unlock, results[0].authInfo, results[0].blob));
  }

  /**
   * Verify an email address for an existing user
   *
   * @param {string}    username
   * @param {string}    token - Verification token
   * @param {function}  fn - Callback function
   */

  verify(username, token) {
    return this.getAuthInfo(username)
      .then((authInfo) => {
        return blobClient.verify(authInfo.blobvault, username, token);
      });
  }

  /**
   * changePassword
   * @param {object} options
   * @param {string} options.username
   * @param {string} options.password
   * @param {string} options.masterkey
   * @param {object} options.blob
   */

  changePassword(options) {
    var password = String(options.password).trim();

    const checkEmailVerified = (authInfo) => {
      if (!authInfo.exists) {
        return Promise.reject(new Error('User does not exists.'));
      }
      if (!authInfo.emailVerified) {
        return Promise.reject(new Error('Email address has not been verified.'));
      }
      return Promise.resolve(authInfo);
    };

    const changePassword = (authInfo, keys, callback) => {
      options.keys = keys;
      return blobClient.updateKeys(options, callback);
    };

    return this.getAuthInfo(options.username)
      .then(checkEmailVerified)
      .then(authInfo => DeriveHelper.deriveLoginKeys(authInfo, password))
      .then(result => DeriveHelper.deriveUnlockKey(result.authInfo, result.password, result.keys))
      .then(result => changePassword(result.authInfo, result.keys));
  }

  /**
   * rename
   * rename a ripple account
   * @param {object} options
   * @param {string} options.username
   * @param {string} options.new_username
   * @param {string} options.password
   * @param {string} options.masterkey
   * @param {object} options.blob
   * @param {function} fn
   */

  rename(options) {
    var new_username = String(options.new_username).trim();
    var password     = String(options.password).trim();

    const checkEmailVerified = this.getAuthInfo(options.username)
      .then((authInfo) => {
        if (!authInfo.exists) {
          return Promise.reject(new Error('User does not exists.'));
        }
        if (!authInfo.emailVerified) {
          return Promise.reject(new Error('Email address has not been verified.'));
        }
        return Promise.resolve();
      });

    const checkNewUsernameExists = (authInfo) => {
      if (authInfo && authInfo.exists) {
        return Promise.reject(new Error('username already taken.'));
      }
      // user name is replaced because of case
      // FIXME another way to change user name
      authInfo.username = new_username;
      return Promise.resolve({ authInfo, password });
    };

    function renameBlob (authInfo, keys) {
      options.keys = keys;
      return blobClient.rename(options);
    };

    return checkEmailVerified
      .then(() => this.getAuthInfo(new_username))
      .then(checkNewUsernameExists)
      .then(result => DeriveHelper.deriveLoginKeys(result.authInfo, result.password))
      .then(result => DeriveHelper.deriveUnlockKey(result.authInfo, result.password, result.keys))
      .then(result => renameBlob(result.authInfo, result.keys));
  }

  /**
   * Register a new user and save to the blob vault
   *
   * @param {object} options
   * @param {string} options.username
   * @param {string} options.password
   * @param {string} options.masterkey   //optional, will create if absent
   * @param {string} options.email
   * @param {string} options.activateLink
   * @param {object} options.oldUserBlob //optional
   * @param {function} fn
   */

  register(options) {
    var username = String(options.username).trim();
    var password = String(options.password).trim();

    if (!this.validateEmail(options.email).valid) {
      return Promise.reject(new Error('Invalid email address'));
    }

    if (username.indexOf('@') > 0) {
      // email address
      if (options.email !== username) {
        return Promise.reject(new Error('Username does not match email address'));
      }
    } else {
      // ordinary username
      if (!this.validateUsername(username).valid) {
        return Promise.reject(new Error('Invalid username'));
      }
    }

    const create = (authInfo, keys) => {
      var params = {
        url: authInfo.blobvault,
        id: keys.id,
        crypt: keys.crypt,
        unlock: keys.unlock,
        username: username,
        email: options.email,
        masterkey: options.masterkey || crypt.createMaster(),
        activateLink: options.activateLink,
        oldUserBlob: options.oldUserBlob,
        domain: options.domain,
      };

      return blobClient.create(params)
        .then((blob) => {
          return Promise.resolve({
            blob: blob,
            username: username,
          });
        });
    };

    return this.getAuthInfo(username)
      .then(authInfo => DeriveHelper.deriveLoginKeys(authInfo, password))
      .then(result => DeriveHelper.deriveUnlockKey(result.authInfo, result.password, result.keys))
      .then(result => create(result.authInfo, result.keys));
  }

  /**
   * validateUsername
   * check username for validity
   */

  validateUsername(username) {
    username   = String(username).trim();
    var result = {
      valid: false,
      reason: '',
    };

    if (username.length < 2) {
      result.reason = 'tooshort';
    } else if (username.length > 20) {
      result.reason = 'toolong';
    } else if (!/^[a-zA-Z0-9\-]+$/.exec(username)) {
      result.reason = 'charset';
    } else if (/^-/.exec(username)) {
      result.reason = 'starthyphen';
    } else if (/-$/.exec(username)) {
      result.reason = 'endhyphen';
    } else if (/--/.exec(username)) {
      result.reason = 'multhyphen';
    } else {
      result.valid = true;
    }

    return result;
  }

  /**
   * validateEmail
   * check email adderss for validity
   */

  validateEmail(email) {
    email   = String(email).trim();
    var result = {
      valid: false,
      reason: '',
    };

    var emailRE = new RegExp('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$');
    if (!emailRE.exec(email)) {
      result.reason = 'invalidemail';
    } else {
      result.valid = true;
    }

    return result;
  }

  /**
   * generateDeviceID
   * create a new random device ID for 2FA
   */
  generateDeviceID() {
    return crypt.createSecret(4);
  }
}

// TODO use extend ?

/*** pass thru some blob client function ***/

VaultClient.prototype.resendEmail   = blobClient.resendEmail;

VaultClient.prototype.recoverBlob   = blobClient.recoverBlob;

VaultClient.prototype.deleteBlob    = blobClient.deleteBlob;

VaultClient.prototype.requestToken  = blobClient.requestToken;

VaultClient.prototype.verifyToken   = blobClient.verifyToken;

VaultClient.prototype.getAttestation = blobClient.getAttestation;

VaultClient.prototype.updateAttestation = blobClient.updateAttestation;

VaultClient.prototype.getAttestationSummary = blobClient.getAttestationSummary;

VaultClient.prototype.requestPhoneToken = blobClient.requestPhoneToken;

VaultClient.prototype.verifyPhoneToken = blobClient.verifyPhoneToken;

// export by name
export { AuthInfo, Blob, RippleTxt };
