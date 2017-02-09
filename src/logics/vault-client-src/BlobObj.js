import request from 'superagent';
import extend from 'extend';
import crypt from './crypt';
import SignedRequest from './signedrequest';
import Identity, { identityRoot } from './Identity';

// Blob object class

export default class BlobObj {
  constructor(options = {}) {
    this.device_id = options.device_id;
    this.url       = options.url;
    this.id        = options.blob_id;
    this.key       = options.key;
    this.identity  = new Identity(this);
    this.data      = {};

    if (this.url && this.url.indexOf('://') === -1) {
      this.url = `http://${this.url}`;
    }

    BlobObj.initOps();
  }

  // init static member variables
  static initOps() {
    if (this.ops && this.opsReverseMap) return;

    // Blob operations
    // Do NOT change the mapping of existing ops
    this.ops = {
      // Special
      noop: 0,

      // Simple ops
      set: 16,
      unset: 17,
      extend: 18,

      // Meta ops
      push: 32,
      pop: 33,
      shift: 34,
      unshift: 35,
      filter: 36,
    };

    this.opsReverseMap = [];
    Object.keys(this.ops).forEach((name) => {
      this.opsReverseMap[this.ops[name]] = name;
    });
  }

  // deserialize
  static deserialize(obj) {
    const {
      device_id,
      url,
      id,
      key,
      identity,
      data,
      ...blobRest
    } = obj;

    const params = {
      device_id,
      url,
      blob_id: id,
      key,
    };

    const blobObj = new BlobObj(params);
    Object.keys(identity).forEach((identityKey) => {
      blobObj.identity[identityKey] = identity[identityKey];
    });

    blobObj.data = data;

    Object.keys(blobRest).forEach((blobRestKey) => {
      blobObj[blobRestKey] = blobRest[blobRestKey];
    });

    return blobObj;
  }

  /**
   * Initialize a new blob object
   *
   * @param {function} fn - Callback function
   */
  init() {
    return new Promise((resolve, reject) => {
      const self = this;

      let url = `${this.url}/v1/blob/${this.id}`;
      if (this.device_id) url += `?device_id=${this.device_id}`;

      request.get(url, (err, resp) => {
        if (err) {
          reject(new Error(err.message || 'Could not retrieve blob'));
          return;
        } else if (!resp.body) {
          reject(new Error('Could not retrieve blob'));
          return;
        } else if (resp.body.twofactor) {
          resp.body.twofactor.blob_id   = self.id;
          resp.body.twofactor.blob_url  = self.url;
          resp.body.twofactor.device_id = self.device_id;
          resp.body.twofactor.blob_key  = self.key;
          // TODO check
          reject(resp.body);
          return;
        } else if (resp.body.result !== 'success') {
          reject(new Error('Incorrect username or password'));
          return;
        }

        self.revision         = resp.body.revision;
        self.encrypted_secret = resp.body.encrypted_secret;
        self.identity_id      = resp.body.identity_id;
        self.id_token         = resp.body.id_token;   // FIXME not assigned
        self.missing_fields   = resp.body.missing_fields;
        // self.attestations     = resp.body.attestation_summary;
        self.last_password_change_date = resp.body.last_password_change_date;
        self.last_password_change_timestamp = resp.body.last_password_change_timestamp;

        if (!self.decrypt(resp.body.blob)) {
          reject(new Error('Error while decrypting blob'));
          return;
        }

        // Apply patches
        if (resp.body.patches && resp.body.patches.length) {
          let successful = true;
          resp.body.patches.forEach((patch) => {
            successful = successful && self.applyEncryptedPatch(patch);
          });

          if (successful) {
            self.consolidate()
              .catch((err) => {});
          }
        }

        // return with newly decrypted blob
        resolve(self);
      }).timeout(8000);
    });
  }

  /**
   * Consolidate -
   * Consolidate patches as a new revision
   *
   * @param {function} fn - Callback function
   */

  consolidate() {
    return new Promise((resolve, reject) => {
      // console.log('client: blob: consolidation at revision', this.revision);
      const encrypted = this.encrypt();

      const config = {
        method: 'POST',
        url: `${this.url}/v1/blob/consolidate`,
        dataType: 'json',
        data: {
          blob_id: this.id,
          data: encrypted,
          revision: this.revision,
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(this.data.auth_secret, this.id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          // XXX Add better error information to exception
          if (err) {
            reject(new Error('Failed to consolidate blob - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else {
            reject(new Error('Failed to consolidate blob'));
          }
        });
    });
  }

  /**
   * ApplyEncryptedPatch -
   * save changes from a downloaded patch to the blob
   *
   * @param {string} patch - encrypted patch string
   */

  applyEncryptedPatch(patch) {
    try {
      const args = JSON.parse(crypt.decrypt(this.key, patch));
      const op   = args.shift();
      const path = args.shift();

      this.applyUpdate(op, path, args);
      this.revision++;

      return true;
    } catch (err) {
      // console.log('client: blob: failed to apply patch:', err.toString());
      // console.log(err.stack);
      return false;
    }
  }

  /**
   * Encrypt secret with unlock key
   *
   * @param {string} secretUnlockkey
   */
  encryptSecret(secretUnlockKey, secret) {
    return crypt.encrypt(secretUnlockKey, secret);
  }

  /**
   * Decrypt secret with unlock key
   *
   * @param {string} secretUnlockkey
   */

  decryptSecret(secretUnlockKey) {
    return crypt.decrypt(secretUnlockKey, this.encrypted_secret);
  }

  /**
   * Decrypt blob with crypt key
   *
   * @param {string} data - encrypted blob data
   */

  decrypt(data) {
    try {
      this.data = JSON.parse(crypt.decrypt(this.key, data));
      return this;
    } catch (e) {
      // console.log('client: blob: decryption failed', e.toString());
      // console.log(e.stack);
      return false;
    }
  }

  /**
   * Encrypt blob with crypt key
   */

  encrypt() {
  // Filter Angular metadata before encryption
  //  if ('object' === typeof this.data &&
  //      'object' === typeof this.data.contacts)
  //    this.data.contacts = angular.fromJson(angular.toJson(this.data.contacts));

    return crypt.encrypt(this.key, JSON.stringify(this.data));
  }

  /**
   * Encrypt recovery key
   *
   * @param {string} secret
   * @param {string} blobDecryptKey
   */

  static encryptBlobCrypt(secret, blobDecryptKey) {
    const recoveryEncryptionKey = crypt.deriveRecoveryEncryptionKeyFromSecret(secret);
    return crypt.encrypt(recoveryEncryptionKey, blobDecryptKey);
  }

  /**
   * Decrypt recovery key
   *
   * @param {string} secret
   * @param {string} encryptedKey
   */

  // FIXME
  static decryptBlobCrypt(secret, encryptedKey) {
    const recoveryEncryptionKey = crypt.deriveRecoveryEncryptionKeyFromSecret(secret);
    return crypt.decrypt(recoveryEncryptionKey, encryptedKey);
  }

  /** ** Blob updating functions ****/

  /**
   * Set blob element
   */

  set(pointer, value) {
    if (pointer == `/${identityRoot}` && this.data[identityRoot]) {
      return Promise.reject(new Error('Cannot overwrite Identity Vault'));
    }

    return this.applyUpdate('set', pointer, [value])
      .then(() => this.postUpdate('set', pointer, [value]));
  }

  /**
   * Remove blob element
   */

  unset(pointer) {
    if (pointer == `/${identityRoot}`) {
      return Promise.reject(new Error('Cannot remove Identity Vault'));
    }

    return this.applyUpdate('unset', pointer, [])
      .then(() => this.postUpdate('unset', pointer, []));
  }

  /**
   * Extend blob object
   */

  extend(pointer, value) {
    return this.applyUpdate('extend', pointer, [value])
      .then(() => this.postUpdate('extend', pointer, [value]));
  }

  /**
   * Prepend blob array
   */

  unshift(pointer, value) {
    return this.applyUpdate('unshift', pointer, [value])
      .then(() => this.postUpdate('unshift', pointer, [value]));
  }

  /**
   * Filter the row(s) from an array.
   *
   * This method will find any entries from the array stored under `pointer` and
   * apply the `subcommands` to each of them.
   *
   * The subcommands can be any commands with the pointer parameter left out.
   */

  filter(pointer, field, value, subcommands) {
    var args = Array.prototype.slice.apply(arguments);

    args.shift();

    // Normalize subcommands to minimize the patch size
    args = args.slice(0, 2).concat(this.normalizeSubcommands(args.slice(2), true));

    return this.applyUpdate('filter', pointer, args)
      .then(() => this.postUpdate('filter', pointer, args));
  }

  /**
   * Apply udpdate to the blob
   */

  applyUpdate(op, path, params) {
    // Exchange from numeric op code to string
    if (typeof op === 'number') {
      op = BlobObj.opsReverseMap[op];
    }

    if (typeof op !== 'string') {
      return Promise.reject(new Error('Blob update op code must be a number or a valid op id string'));
    }

    // Separate each step in the 'pointer'
    const pointer = path.split('/');
    const first = pointer.shift();

    if (first !== '') {
      return Promise.reject(new Error(`Invalid JSON pointer: ${path}`));
    }

    return this._traverse(this.data, pointer, path, op, params);
  }

  // for applyUpdate function
  _traverse(context, pointer, originalPointer, op, params) {
    const _this = this;
    let part = _this.unescapeToken(pointer.shift());

    if (Array.isArray(context)) {
      if (part === '-') {
        part = context.length;
      } else if (part % 1 !== 0 && part >= 0) {
        return Promise.reject(new Error('Invalid pointer, array element segments must be a positive integer, zero or -'));
      }
    } else if (typeof context !== 'object') {
      return Promise.resolve();
    } else if (!context.hasOwnProperty(part)) {
      // Some opcodes create the path as they're going along
      if (op === 'set') {
        context[part] = {};
      } else if (op === 'unshift') {
        context[part] = [];
      } else {
        return Promise.resolve();
      }
    }

    if (pointer.length !== 0) {
      return this._traverse(context[part], pointer, originalPointer, op, params);
    }

    switch (op) {
      case 'set':
        context[part] = params[0];
        break;
      case 'unset':
        if (Array.isArray(context)) {
          context.splice(part, 1);
        } else {
          delete context[part];
        }
        break;
      case 'extend':
        if (typeof context[part] !== 'object') {
          return Promise.reject(new Error('Tried to extend a non-object'));
        }
        extend(true, context[part], params[0]);
        break;
      case 'unshift':
        if (typeof context[part] === 'undefined') {
          context[part] = [];
        } else if (!Array.isArray(context[part])) {
          return Promise.reject(new Error('Operator "unshift" must be applied to an array.'));
        }
        context[part].unshift(params[0]);
        break;
      case 'filter':
        if (Array.isArray(context[part])) {
          context[part].forEach((element, i) => {
            if (typeof element === 'object' && element.hasOwnProperty(params[0]) && element[params[0]] === params[1]) {
              var subpointer = originalPointer + '/' + i;
              var subcommands = _this.normalizeSubcommands(params.slice(2));

              subcommands.forEach(function(subcommand) {
                var op = subcommand[0];
                var pointer = subpointer + subcommand[1];
                _this.applyUpdate(op, pointer, subcommand.slice(2));
              });
            }
          });
        }
        break;
      default:
        return Promise.reject(new Error(`Unsupported op ${op}`));
    }
    return Promise.resolve();
  }

  escapeToken(token) {
    return token.replace(/[~\/]/g, (key) => {
      return key === '~' ? '~0' : '~1';
    });
  }

  unescapeToken(str) {
    return str.replace(/~./g, (m) => {
      switch (m) {
        case '~0':
          return '~';
        case '~1':
          return '/';
      }
      throw new Error(`Invalid tilde escape: ${m}`);
    });
  }

  /**
   * Sumbit update to blob vault
   */

  postUpdate(op, pointer, params) {
    if (typeof op === 'string') {
      op = BlobObj.ops[op];
    }

    if (typeof op !== 'number') {
      return Promise.reject(new Error('Blob update op code must be a number or a valid op id string'));
    }

    if (op < 0 || op > 255) {
      return Promise.reject(new Error('Blob update op code out of bounds'));
    }

    params.unshift(pointer);
    params.unshift(op);

    return new Promise((resolve, reject) => {
      // console.log('client: blob: submitting update', BlobObj.opsReverseMap[op], pointer, params);

      const config = {
        method: 'POST',
        url: `${this.url}/v1/blob/patch`,
        dataType: 'json',
        data: {
          blob_id: this.id,
          patch: crypt.encrypt(this.key, JSON.stringify(params)),
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(this.data.auth_secret, this.id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            reject(new Error('Patch could not be saved - XHR error'));
          } else if (!resp.body || resp.body.result !== 'success') {
            reject(new Error('Patch could not be saved - bad result'));
          } else {
            resolve(resp.body);
          }
        });
    });
  }

  /**
   * get2FA - HMAC signed request
   */

  get2FA() {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'GET',
        url    : `${this.url}/v1/blob/${this.id}/2FA`,
      };
      if (this.device_id) {
        config.url += `?device_id=${this.device_id}`;
      }

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(this.data.auth_secret, this.id);

      request.get(signed.url)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else {
            reject(new Error('Unable to retrieve settings.'));
          }
        });
    });
  }

  /**
   * set2FA
   * modify 2 factor auth settings
   * @params {object}  options
   * @params {string}  options.masterkey
   * @params {boolean} options.enabled
   * @params {string}  options.phone
   * @params {string}  options.country_code
   */

  set2FA(options) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'POST',
        url    : `${this.url}/v1/blob/${this.id}/2FA`,
        data   : {
          enabled      : options.enabled,
          phone        : options.phone,
          country_code : options.country_code,
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(options.masterkey, this.data.account_id, this.id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(resp.body);
          } else {
            reject(new Error('Unable to update settings.'));
          }
        });
    });
  }

  /***** helper functions *****/
  normalizeSubcommands(subcommands, compress) {
    // Normalize parameter structure
    if (/(number|string)/.test(typeof subcommands[0])) {
      // Case 1: Single subcommand inline
      subcommands = [subcommands];
    } else if (subcommands.length === 1 && Array.isArray(subcommands[0]) && /(number|string)/.test(typeof subcommands[0][0])) {
      // Case 2: Single subcommand as array
      // (nothing to do)
    } else if (Array.isArray(subcommands[0])) {
      // Case 3: Multiple subcommands as array of arrays
      subcommands = subcommands[0];
    }

    // Normalize op name and convert strings to numeric codes
    subcommands = subcommands.map((subcommand) => {
      if (typeof subcommand[0] === 'string') {
        subcommand[0] = BlobObj.ops[subcommand[0]];
      }

      if (typeof subcommand[0] !== 'number') {
        throw new Error('Invalid op in subcommand');
      }

      if (typeof subcommand[1] !== 'string') {
        throw new Error('Invalid path in subcommand');
      }

      return subcommand;
    });

    if (compress) {
      // Convert to the minimal possible format
      if (subcommands.length === 1) {
        return subcommands[0];
      } else {
        return [subcommands];
      }
    } else {
      return subcommands;
    }
  }
}
