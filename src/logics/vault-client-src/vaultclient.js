import blobClient, { Blob } from './blob';
import AuthInfo from './authinfo';
import RippleTxt from './rippletxt';
import crypt from './crypt';
import Utils from './utils';

class CustomKeys {
  constructor(authInfo, password) {
    this.authInfo = authInfo;
    this.username = authInfo.username;
    this.password = password;
    this.id = null;
    this.crypt = null;      // login
    this.unlock = null;     // unlock
  }

  static deserialize(obj) {
    const customKeys = new CustomKeys(obj.authInfo, obj.password);
    customKeys.id = obj.id;
    customKeys.crypt = obj.crypt;
    customKeys.unlock = obj.unlock;
    return customKeys;
  }

  setPassword(password) {
    if (this.password !== password) {
      this.id = null;
      this.crypt = null;
      this.unlock = null;
      this.password = password;
    }
  }

  setUsername(username) {
    if (this.username !== username) {
      this.id = null;
      this.crypt = null;
      this.unlock = null;
      this.username = username;
      this.authInfo.username = username;
    }
  }

  /**
   * deriveLoginKeys
   */
  deriveLoginKeys() {
    const normalizedUsername = this.authInfo.username.toLowerCase().replace(/-/g, '');

    if (this.id && this.crypt) {
      console.log('deriveLoginKeys: use existing');
      return Promise.resolve(this);
    }

    // derive login keys
    return crypt.derive(this.authInfo.pakdf, 'login', normalizedUsername, this.password)
      .then((keys) => {
        console.log('deriveLoginKeys: derived new');
        this.id = keys.id;
        this.crypt = keys.crypt;
        return Promise.resolve(this);
      });
  }

  /**
   * deriveUnlockKey
   */
  deriveUnlockKey() {
    const normalizedUsername = this.authInfo.username.toLowerCase().replace(/-/g, '');

    if (this.unlock) {
      console.log('deriveUnlockKey: use existing');
      return Promise.resolve(this);
    }

    // derive unlock key
    return crypt.derive(this.authInfo.pakdf, 'unlock', normalizedUsername, this.password)
      .then((keys) => {
        console.log('deriveUnlockKey: derived new');
        this.unlock = keys.unlock;
        return Promise.resolve(this);
      });
  }

  deriveKeys() {
    return this.deriveLoginKeys()
      .then(() => this.deriveUnlockKey());
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
      if (!authInfo || !authInfo.exists) {
        return Promise.reject(new Error('User does not exists.'));
      }
      return Promise.resolve({ authInfo, password });
    };

    const getBlob = (customKeys) => {
      const options = {
        url: customKeys.authInfo.blobvault,
        blob_id: customKeys.id,
        key: customKeys.crypt,
        device_id: device_id,
      };
      return blobClient.get(options);
    };

    const updateKeys = (customKeys, blob) => {
      if (!customKeys.unlock) {
        // unable to unlock
        return;
      }

      let secret;
      try {
        secret = crypt.decrypt(customKeys.unlock, blob.encrypted_secret);
      } catch (error) {
        console.log('error:', 'decrypt:', error);
        return;
      }

      const options = {
        username: customKeys.username,
        blob: blob,
        masterkey: secret,
        keys: customKeys,
      };

      blobClient.updateKeys(options)
        .then((resp) => {
          // do nothing
        }).catch((err) => {
          console.log('error:', 'updateKeys:', err);
        });
    };

    const processBlob = (customKeys, blob) => {
      const authInfo = customKeys.authInfo;

      // save for relogin
      this.infos[customKeys.id] = authInfo;

      // migrate missing fields
      if (blob.missing_fields) {
        if (blob.missing_fields.encrypted_blobdecrypt_key || blob.missing_fields.encrypted_secretdecrypt_key) {
          console.log('migration: saving encrypted blob / secret decrypt key');
          // get the key to unlock the secret, then update the blob keys
          customKeys.deriveUnlockKey()
            .then(() => {
              updateKeys(customKeys, blob);
            })
            .catch((err) => {
              // unable to unlock
            });
        }
      }

      return Promise.resolve({
        blob: blob,
        customKeys: customKeys,
        username: authInfo.username,
        emailVerified: authInfo.emailVerified,
        phoneVerified: authInfo.phoneVerified,
      });
    };

    const loginKeysPromise = this.getAuthInfo(username)
      .then(checkExists)
      .then((result) => {
        const customKeys = new CustomKeys(result.authInfo, result.password);
        return customKeys.deriveLoginKeys();
      });

    const blobPromise = loginKeysPromise
      .then(customKeys => getBlob(customKeys));

    return Promise.all([loginKeysPromise, blobPromise])
      .then(results => processBlob(results[0], results[1]));
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
   */

  unlock(encryptSecret, customKeys) {
    if (!customKeys.authInfo.exists) {
      return Promise.reject(new Error('User does not exists.'));
    }

    return customKeys.deriveUnlockKey()
      .then(() => {
        try {
          const secret = crypt.decrypt(customKeys.unlock, encryptSecret);
          return Promise.resolve({ customKeys, secret });
        } catch (error) {
          return Promise.reject(error);
        }
      });
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

      return Promise.resolve({ authInfo, password, blob: resp.blob, customKeys: resp.customKeys });
    };

    const unlockSecret = (customKeys, authInfo, blob) => {
      var secret;
      try {
        secret = crypt.decrypt(customKeys.unlock, blob.encrypted_secret);
      } catch (error) {
        return Promise.reject(error);
      }

      return Promise.resolve({
        blob: blob,
        customKeys: customKeys,
        unlock: customKeys.unlock,
        secret: secret,
        username: authInfo.username,
        emailVerified: authInfo.emailVerified,
        phoneVerified: authInfo.phoneVerified,
      });
    };

    let loginPromise = this.login(username, password, device_id)
      .then(postLogin);

    let unlockKeyPromise = loginPromise
      .then(result => result.customKeys.deriveUnlockKey());

    return Promise.all([loginPromise, unlockKeyPromise])
      .then(results => unlockSecret(results[1], results[0].authInfo, results[0].blob));
  }

  /**
   * Verify an email address for an existing user
   *
   * @param {string}    username
   * @param {string}    token - Verification token
   * @param {string}    opts.email
   */

  verifyEmailToken(opts) {
    return this.getAuthInfo(opts.username)
      .then((authInfo) => {
        const blobOpts = {
          url: authInfo.blobvault,
          ...opts,
        };
        return blobClient.verifyEmailToken(blobOpts);
      });
  }

  /**
   * Verify a phone number for an existing user
   *
   * @param {string}    username
   * @param {string}    token - Verification token
   * @param {function}  fn - Callback function
   */

  verifyPhoneToken(opts) {
    return this.getAuthInfo(opts.username)
      .then((authInfo) => {
        const blobOpts = {
          url: authInfo.blobvault,
          ...opts,
        };
        return blobClient.verifyPhoneToken(blobOpts);
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
    const password = String(options.password).trim();

    const customKeys = options.customKeys;
    const authInfo = customKeys.authInfo;

    if (!authInfo.exists) {
      return Promise.reject(new Error('User does not exists.'));
    }
    if (!authInfo.emailVerified) {
      return Promise.reject(new Error('Account has not been verified.'));
    }

    customKeys.setPassword(password);

    return customKeys.deriveKeys()
      .then(() => {
        options.keys = customKeys;
        return blobClient.updateKeys(options);
      });
  }

  /**
   * Update email of a ripple account
   * @param {object} options
   * @param {string} options.username
   * @param {string} options.new_username
   * @param {string} options.password
   * @param {string} options.masterkey
   * @param {object} options.blob
   */

  updateEmail(options) {
    var new_username = String(options.new_username).trim();
    var password     = String(options.password).trim();

    const customKeys = options.customKeys;
    const authInfo = customKeys.authInfo;

    if (!authInfo.exists) {
      return Promise.reject(new Error('User does not exists.'));
    }

    const checkNewUsernameExists = () => {
      if (options.username === new_username) {
        return Promise.resolve({ authInfo, password });
      } else {
        console.log(`Username changes from ${options.username} to ${new_username}`);
        return this.getAuthInfo(new_username)
          .then((newUsernameAuthInfo) => {
            if (newUsernameAuthInfo && newUsernameAuthInfo.exists) {
              return Promise.reject(new Error('username already taken.'));
            }
            return Promise.resolve();
          });
      }
    };

    return checkNewUsernameExists()
      .then(() => {
        // FIXME another way to change user name
        customKeys.setUsername(new_username);
        customKeys.setPassword(password);
        return customKeys.deriveKeys();
      })
      .then((customKeys) => {
        options.keys = customKeys;
        options.blob.data.email = options.email;
        return blobClient.updateEmail(options);
      });
  }

  /**
   * Update phone of a ripple account
   * @param {object} options
   * @param {string} options.username
   * @param {string} options.new_username
   * @param {string} options.password
   * @param {string} options.masterkey
   * @param {object} options.blob
   */

  updatePhone(options) {
    var new_username = String(options.new_username).trim();
    var password     = String(options.password).trim();

    const customKeys = options.customKeys;
    const authInfo = customKeys.authInfo;

    if (!authInfo.exists) {
      return Promise.reject(new Error('User does not exists.'));
    }
    if (!authInfo.emailVerified) {
      return Promise.reject(new Error('Email has not been verified.'));
    }

    const checkNewUsernameExists = () => {
      if (options.username === new_username) {
        return Promise.resolve();
      } else {
        console.log(`Username changes from ${options.username} to ${new_username}`);
        return this.getAuthInfo(new_username)
          .then((newUsernameAuthInfo) => {
            if (newUsernameAuthInfo && newUsernameAuthInfo.exists) {
              return Promise.reject(new Error('username already taken.'));
            }
            return Promise.resolve();
          });
      }
    };

    return checkNewUsernameExists()
      .then(() => {
        // FIXME another way to change user name
        customKeys.setUsername(new_username);
        customKeys.setPassword(password);
        return customKeys.deriveKeys();
      })
      .then((customKeys) => {
        options.keys = customKeys;
        options.blob.data.phone = options.phone;
        return blobClient.updatePhone(options);
      });
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
   */

  rename(options) {
    const new_username = String(options.new_username).trim();
    const password     = String(options.password).trim();

    const customKeys = options.customKeys;
    const authInfo = customKeys.authInfo;

    if (!authInfo.exists) {
      return Promise.reject(new Error('User does not exists.'));
    }
    if (!authInfo.emailVerified) {
      return Promise.reject(new Error('Account has not been verified.'));
    }

    const checkNewUsernameExists = this.getAuthInfo(new_username)
      .then((authInfo) => {
        if (authInfo && authInfo.exists) {
          return Promise.reject(new Error('username already taken.'));
        }
        return Promise.resolve();
      });

    return checkNewUsernameExists
      .then(() => {
        // FIXME another way to change user name
        customKeys.setPassword(password);
        customKeys.setUsername(new_username);
        return customKeys.deriveKeys();
      })
      .then((customKeys) => {
        options.keys = customKeys;
        return blobClient.rename(options);
      });
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

    const create = (authInfo, customKeys) => {
      var params = {
        url: authInfo.blobvault,
        id: customKeys.id,
        crypt: customKeys.crypt,
        unlock: customKeys.unlock,
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
            customKeys: customKeys,
            username: username,
          });
        });
    };

    return this.getAuthInfo(username)
      .then((authInfo) => {
        const customKeys = new CustomKeys(authInfo, password);
        return customKeys.deriveKeys();
      })
      .then(customKeys => create(customKeys.authInfo, customKeys));
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

VaultClient.prototype.requestPhoneTokenForRecovery = blobClient.requestPhoneTokenForRecovery;

VaultClient.prototype.requestEmailTokenForRecovery = blobClient.requestEmailTokenForRecovery;

// export by name
export { AuthInfo, Blob, RippleTxt, Utils, CustomKeys };
