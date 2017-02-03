import request from 'superagent';
import crypt from './crypt';
import SignedRequest from './signedrequest';
import BlobObj from './BlobObj';
import Utils from './utils';

/***** blob client methods ****/

/**
 * Blob object class
 */
export { BlobObj as Blob };

/**
 * Get ripple name for a given address
 */

const BlobClient = {

  getRippleName(url, address) {
    if (!crypt.isValidAddress(address)) {
      return Promise.reject(new Error('Invalid ripple address'));
    }

    if (!crypt.isValidAddress(address)) {
      return Promise.reject(new Error('Invalid ripple address'));
    }

    return new Promise((resolve, reject) => {
      request.get(`${url}/v1/user/${address}`, (err, resp) => {
        if (err) {
          reject(new Error('Unable to access vault sever'));
        } else if (resp.body && resp.body.username) {
          resolve(resp.body.username);
        } else if (resp.body && resp.body.exists === false) {
          reject(new Error('No ripple name for this address'));
        } else {
          reject(new Error('Unable to determine if ripple name exists'));
        }
      });
    });
  },

  /**
   * Retrive a blob with url, id and key
   * @params {object} options
   * @params {string} options.url
   * @params {string} options.blob_id
   * @params {string} options.key
   * @params {string} options.device_id //optional
   */

  get(options) {
    const blob = new BlobObj(options);
    return blob.init();
  },

  /**
   * requestToken
   * request new token to be sent for 2FA
   * @param {string} url
   * @param {string} id
   * @param {string} force_sms
   */

  requestToken(url, id, forceSMS) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'GET',
        url    : `${url}/v1/blob/${id}/2FA/requestToken`,
      };

      if (forceSMS) {
        config.url += '?force_sms=true';
      }

      request.get(config.url)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else {
            reject(new Error('Unable to request authentication token.'));
          }
        });
    });
  },

  /**
   * verifyToken
   * verify a device token for 2FA
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.id
   * @param {string} options.device_id
   * @param {string} options.token
   * @param {boolean} options.remember_me
   */

  verifyToken(options) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'POST',
        url    : `${options.url}/v1/blob/${options.id}/2FA/verifyToken`,
        data   : {
          device_id   : options.device_id,
          token       : options.token,
          remember_me : options.remember_me,
        },
      };

      request.post(config.url)
        .send(config.data)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else {
            reject(new Error('Unable to verify authentication token.'));
          }
        });
    });
  },

  /**
   * Verify email address
   */

  verifyEmailToken(opts) {
    return new Promise((resolve, reject) => {
      const old_id  = opts.blob.id;
      opts.blob.id  = opts.keys.id;
      opts.blob.key = opts.keys.crypt;
      opts.blob.encrypted_secret = opts.blob.encryptSecret(opts.keys.unlock, opts.masterkey);

      const recoveryKey = Utils.createRecoveryKey(opts.blob.data.email, opts.blob.data.phone);

      const config = {
        method : 'POST',
        url    : `${opts.url}/v1/user/${opts.username}/verify/${opts.token}`,
        data   : {
          email    : opts.blob.data.email,
          blob_id  : opts.blob.id,
          data     : opts.blob.encrypt(),
          revision : opts.blob.revision,
          encrypted_secret : opts.blob.encrypted_secret,
          encrypted_blobdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.crypt),
          encrypted_secretdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.unlock),
        },
      };

      request.post(config.url)
        .send(config.data)
        .end((err, resp) => {
          if (err) {
            reject(new Error('Failed to verify the account - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else {
            console.log(resp.body.message);
            reject(new Error('Failed to verify the account'));
          }
        });
    });
  },

  /**
   * resendEmail
   * send a new verification email
   * @param {object}   opts
   * @param {string}   opts.id
   * @param {string}   opts.username
   * @param {string}   opts.account_id
   * @param {string}   opts.email
   * @param {string}   opts.activateLink
   * @param {string}   opts.url
   * @param {string}   opts.masterkey
   */

  resendEmail(opts) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'POST',
        url    : `${opts.url}/v1/user/email`,
        data   : {
          blob_id  : opts.id,
          username : opts.username,
          email    : opts.email,
          hostlink : opts.activateLink,
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(opts.masterkey, opts.account_id, opts.id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'resendEmail:', err);
            reject(new Error('Failed to resend the token'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            console.log('error:', 'resendEmail:', resp.body.message);
            reject(new Error('Failed to resend the token'));
          } else {
            reject(new Error('Failed to resend the token'));
          }
        });
    });
  },

  /**
   * RecoverBlob
   * recover a blob using the account secret
   * @param {object} opts
   * @param {string} opts.url
   * @param {string} opts.username
   * @param {string} opts.email
   * @param {string} opts.phone (optional)
   */

  recoverBlob(opts) {
    const recoveryKey = Utils.createRecoveryKey(opts.email, opts.phone);

    function getRequest() {
      return new Promise((resolve, reject) => {
        const username = String(opts.username).trim();
        const config   = {
          method : 'GET',
          url    : `${opts.url}/v1/user/recover/${username}`,
        };

        request.get(config.url)
          .end((err, resp) => {
            if (err) {
              reject(err);
            } else if (resp.body && resp.body.result === 'success') {
              if (!resp.body.encrypted_blobdecrypt_key || !resp.body.encrypted_secretdecrypt_key) {
                reject(new Error('Missing encrypted blob decrypt key.'));
              } else {
                resolve(resp);
              }
            } else if (resp.body && resp.body.result === 'error') {
              reject(new Error(resp.body.message));
            } else {
              reject(new Error('Could not recover blob'));
            }
          });
      });
    }

    function handleRecovery(resp) {
      return new Promise((resolve, reject) => {
        const params = {
          url     : opts.url,
          blob_id : resp.body.blob_id,
          key     : BlobObj.decryptBlobCrypt(recoveryKey, resp.body.encrypted_blobdecrypt_key),
        };

        const blob = new BlobObj(params);

        blob.revision = resp.body.revision;
        blob.encrypted_secret = resp.body.encrypted_secret;

        if (!blob.decrypt(resp.body.blob)) {
          reject(new Error('Error while decrypting blob'));
          return;
        }

        const unlock = BlobObj.decryptBlobCrypt(recoveryKey, resp.body.encrypted_secretdecrypt_key);
        const secret = crypt.decrypt(unlock, resp.body.encrypted_secret);

        // Apply patches
        if (resp.body.patches && resp.body.patches.length) {
          let successful = true;
          resp.body.patches.forEach((patch) => {
            successful = successful && blob.applyEncryptedPatch(patch);
          });

          if (successful) {
            blob.consolidate();
          }
        }

        // return with newly decrypted blob
        resolve({ blob, secret });
      });
    }

    return getRequest()
      .then(handleRecovery);
  },


  /**
   * updateKeys
   * Change the blob encryption keys
   * @param {object} opts
   * @param {string} opts.username
   * @param {object} opts.keys
   * @param {object} opts.blob
   * @param {string} masterkey
   */

  updateKeys(opts) {
    return new Promise((resolve, reject) => {
      const old_id  = opts.blob.id;
      opts.blob.id  = opts.keys.id;
      opts.blob.key = opts.keys.crypt;
      opts.blob.encrypted_secret = opts.blob.encryptSecret(opts.keys.unlock, opts.masterkey);

      const recoveryKey = Utils.createRecoveryKey(opts.blob.data.email, opts.blob.data.phone);

      const config = {
        method : 'POST',
        url    : `${opts.blob.url}/v1/user/${opts.username}/updatekeys`,
        data   : {
          blob_id  : opts.blob.id,
          data     : opts.blob.encrypt(),
          revision : opts.blob.revision,
          encrypted_secret : opts.blob.encrypted_secret,
          encrypted_blobdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.crypt),
          encrypted_secretdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.unlock),
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(opts.masterkey, opts.blob.data.account_id, old_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'updateKeys:', err);
            reject(new Error('Failed to update blob - XHR error'));
          } else if (!resp.body || resp.body.result !== 'success') {
            console.log('error:', 'updateKeys:', resp.body ? resp.body.message : null);
            reject(new Error('Failed to update blob - bad result'));
          } else {
            resolve(resp.body);
          }
        });
    });
  },

  /**
   * rename
   * Change the username
   * @param {object} opts
   * @param {string} opts.username
   * @param {string} opts.new_username
   * @param {object} opts.keys
   * @param {object} opts.blob
   * @param {string} masterkey
   */

  rename(opts) {
    return new Promise((resolve, reject) => {
      const old_id  = opts.blob.id;
      opts.blob.id  = opts.keys.id;
      opts.blob.key = opts.keys.crypt;
      opts.blob.encryptedSecret = opts.blob.encryptSecret(opts.keys.unlock, opts.masterkey);

      const recoveryKey = Utils.createRecoveryKey(opts.blob.data.email, opts.blob.data.phone);

      const config = {
        method: 'POST',
        url: `${opts.blob.url}/v1/user/${opts.username}/rename`,
        data: {
          blob_id  : opts.blob.id,
          username : opts.new_username,
          data     : opts.blob.encrypt(),
          revision : opts.blob.revision,
          encrypted_secret : opts.blob.encryptedSecret,
          encrypted_blobdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.crypt),
          encrypted_secretdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.unlock),
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(opts.masterkey, opts.blob.data.account_id, old_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'rename:', err);
            reject(new Error('Failed to rename'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            console.log('error:', 'rename:', resp.body.message);
            reject(new Error('Failed to rename'));
          } else {
            reject(new Error('Failed to rename'));
          }
        });
    });
  },

  /**
   * Create a blob object
   *
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.id
   * @param {string} options.crypt
   * @param {string} options.unlock
   * @param {string} options.username
   * @param {string} options.masterkey
   * @param {object} options.oldUserBlob
   * @param {object} options.domain
   */

  create(options) {
    return new Promise((resolve, reject) => {
      const params = {
        url     : options.url,
        blob_id : options.id,
        key     : options.crypt,
      };
      const blob = new BlobObj(params);

      blob.revision = 0;

      blob.data = {
        auth_secret : crypt.createSecret(8),
        account_id  : crypt.getAddress(options.masterkey),
        email       : options.email,
        contacts    : [],
        created     : (new Date()).toJSON(),
        phone       : null,
      };

      blob.encrypted_secret = blob.encryptSecret(options.unlock, options.masterkey);

      // Migration
      if (options.oldUserBlob) {
        blob.data.contacts = options.oldUserBlob.data.contacts;
      }

      const recoveryKey = Utils.createRecoveryKey(options.email);

      // post to the blob vault to create
      const config = {
        method : 'POST',
        url    : `${options.url}/v1/user`,
        data   : {
          blob_id     : options.id,
          username    : options.username,
          address     : blob.data.account_id,
          auth_secret : blob.data.auth_secret,
          data        : blob.encrypt(),
          email       : options.email,
          hostlink    : options.activateLink,
          domain      : options.domain,
          encrypted_blobdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, options.crypt),
          encrypted_secretdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, options.unlock),
          encrypted_secret : blob.encrypted_secret,
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(options.masterkey, blob.data.account_id, options.id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            blob.identity_id = resp.body.identity_id;
            resolve(blob);
          } else if (resp.body && resp.body.result === 'error') {
            const err = new Error(resp.body.message);
            if (resp.body.missing) err.missing = resp.body.missing;
            reject(err);
          } else {
            reject(new Error('Could not create blob'));
          }
        });
    });
  },

  /**
   * deleteBlob
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.username
   * @param {string} options.blob_id
   * @param {string} options.account_id
   * @param {string} options.masterkey
   */

  deleteBlob(options) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'DELETE',
        url    : `${options.url}/v1/user/${options.username}`,
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(options.masterkey, options.account_id, options.blob_id);
      request.del(signed.url)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else if (resp.error && resp.error.status === 404) {
            reject(new Error('Blob not found'));
          } else {
            if (resp.error) console.log(resp.error.toString());
            reject(new Error('Could not delete blob'));
          }
        });
    });
  },

  /*** identity related functions ***/

  /**
   * updateProfile
   * update information stored outside the blob - HMAC signed
   * @param {object}
   * @param {string} opts.url
   * @param {string} opts.auth_secret
   * @param {srring} opts.blob_id
   * @param {object} opts.profile
   * @param {array}  opts.profile.attributes (optional, array of attribute objects)
   * @param {array}  opts.profile.addresses (optional, array of address objects)
   *
   * @param {string} attribute.id ... id of existing attribute
   * @param {string} attribute.name ... attribute name i.e. ripple_address
   * @param {string} attribute.type ... optional, sub-type of attribute
   * @param {string} attribute.value ... value of attribute
   * @param {string} attribute.domain ... corresponding domain
   * @param {string} attribute.status ... “current”, “removed”, etc.
   * @param {string} attribute.visibitlity ... “public”, ”private”
   */

  updateProfile(opts) {
    return new Promise((resolve, reject) => {
      const config = {
        method: 'POST',
        url: `${opts.url}/v1/profile/`,
        dataType: 'json',
        data: opts.profile,
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(opts.auth_secret, opts.blob_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'updateProfile:', err);
            reject(new Error('Failed to update profile - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body) {
            console.log('error:', 'updateProfile:', resp.body);
            reject(new Error('Failed to update profile'));
          } else {
            reject(new Error('Failed to update profile'));
          }
        });
    });
  },

  /**
   * getProfile
   * @param {Object} opts
   * @param {string} opts.url
   * @param {string} opts.auth_secret
   * @param {srring} opts.blob_id
   */

  getProfile(opts) {
    return new Promise((resolve, reject) => {
      const config = {
        method: 'GET',
        url: `${opts.url}/v1/profile/`,
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(opts.auth_secret, opts.blob_id);

      request.get(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'getProfile:', err);
            reject(new Error('Failed to get profile - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body) {
            console.log('error:', 'getProfile:', resp.body);
            reject(new Error('Failed to get profile'));
          } else {
            reject(new Error('Failed to get profile'));
          }
        });
    });
  },

  /**
   * getAttestation
   * @param {Object} opts
   * @param {string} opts.url
   * @param {string} opts.auth_secret
   * @param {string} opts.blob_id
   * @param {string} opts.type (email,phone,basic_identity)
   * @param {object} opts.phone (required for type 'phone')
   * @param {string} opts.email (required for type 'email')
   */

  getAttestation(opts) {
    return new Promise((resolve, reject) => {
      const params = { };

      if (opts.phone) params.phone = opts.phone;
      if (opts.email) params.email = opts.email;

      const config = {
        method: 'POST',
        url: `${opts.url}/v1/attestation/${opts.type}`,
        dataType: 'json',
        data: params,
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(opts.auth_secret, opts.blob_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'attest:', err);
            reject(new Error('attestation error - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            if (resp.body.attestation) {
              const parsedRespBody = {
                ...resp.body,
                decoded: BlobClient.parseAttestation(resp.body.attestation),
              };
              resolve(parsedRespBody);
            } else {
              resolve(resp.body);
            }
          } else if (resp.body) {
            console.log('error:', 'attestation:', resp.body);
            reject(new Error(`attestation error: ${resp.body.message || ''}`));
          } else {
            reject(new Error('attestation error'));
          }
        });
    });
  },

  /**
   * getAttestationSummary
   * @param {Object} opts
   * @param {string} opts.url
   * @param {string} opts.auth_secret
   * @param {string} opts.blob_id
   */

  getAttestationSummary(opts) {
    return new Promise((resolve, reject) => {
      const config = {
        method    : 'GET',
        url       : `${opts.url}/v1/attestation/summary`,
        dataType  : 'json',
      };

      if (opts.full) config.url += '?full=true';

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(opts.auth_secret, opts.blob_id);

      request.get(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'attest:', err);
            reject(new Error('attestation error - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            if (resp.body.attestation) {
              const parsedRespBody = {
                ...resp.body,
                decoded: BlobClient.parseAttestation(resp.body.attestation),
              };
              resolve(parsedRespBody);
            } else {
              resolve(resp.body);
            }
          } else if (resp.body) {
            console.log('error:', 'attestation:', resp.body);
            reject(new Error(`attestation error: ${resp.body.message || ''}`));
          } else {
            reject(new Error('attestation error'));
          }
        });
    });
  },

  /**
   * updateAttestation
   * @param {Object} opts
   * @param {string} opts.url
   * @param {string} opts.auth_secret
   * @param {string} opts.blob_id
   * @param {string} opts.type (email,phone,profile,identity)
   * @param {object} opts.phone (required for type 'phone')
   * @param {object} opts.profile (required for type 'profile')
   * @param {string} opts.email (required for type 'email')
   * @param {string} opts.answers (required for type 'identity')
   * @param {string} opts.token (required for completing email or phone attestations)
   */

  updateAttestation(opts) {
    return new Promise((resolve, reject) => {
      const params = { };

      if (opts.phone)    params.phone   = opts.phone;
      if (opts.profile)  params.profile = opts.profile;
      if (opts.email)    params.email   = opts.email;
      if (opts.token)    params.token   = opts.token;
      if (opts.answers)  params.answers = opts.answers;

      const config = {
        method    : 'POST',
        url       : `${opts.url}/v1/attestation/${opts.type}/update`,
        dataType  : 'json',
        data      : params,
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signHmac(opts.auth_secret, opts.blob_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            console.log('error:', 'attest:', err);
            reject(new Error('attestation error - XHR error'));
          } else if (resp.body && resp.body.result === 'success') {
            if (resp.body.attestation) {
              const parsedRespBody = {
                ...resp.body,
                decoded: BlobClient.parseAttestation(resp.body.attestation),
              };
              resolve(parsedRespBody);
            } else {
              resolve(resp.body);
            }
          } else if (resp.body) {
            console.log('error:', 'attestation:', resp.body);
            reject(new Error(`attestation error: ${resp.body.message || ''}`));
          } else {
            reject(new Error('attestation error'));
          }
        });
    });
  },


  /**
   * parseAttestation
   * @param {Object} attestation
   */

  parseAttestation(attestation) {
    const segments = decodeURIComponent(attestation).split('.');
    let decoded;

    // base64 decode and parse JSON
    try {
      decoded = {
        header    : JSON.parse(crypt.decodeBase64(segments[0])),
        payload   : JSON.parse(crypt.decodeBase64(segments[1])),
        signature : segments[2],
      };
    } catch (e) {
      console.log('invalid attestation:', e);
    }

    return decoded;
  },


  /**
   * requestPhoneToken
   * request a token for phone verification
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.blob_id
   * @param {string} options.phone_number
   * @param {string} options.country_code
   * @param {string} options.masterkey
   */

  requestPhoneToken(options) {
    return new Promise((resolve, reject) => {
      const config = {
        method : 'POST',
        url    : `${options.url}/v1/blob/${options.blob_id}/phone/request`,
        data   : {
          via          : 'sms',
          phone_number : options.phone_number,
          country_code : options.country_code,
          phone_changed: options.phone_changed,
        },
      };

      const signedRequest = new SignedRequest(config);
      const signed = signedRequest.signAsymmetric(options.masterkey, options.account_id, options.blob_id);

      request.post(signed.url)
        .send(signed.data)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else {
            reject(new Error('Unable to request phone token.'));
          }
        });
    });
  },

  /**
   * verifyPhoneToken
   * verify a phone token
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.blob_id
   * @param {string} options.token
   */

  verifyPhoneToken(opts) {
    return new Promise((resolve, reject) => {
      const old_id  = opts.blob.id;
      opts.blob.id  = opts.keys.id;
      opts.blob.key = opts.keys.crypt;
      opts.blob.encrypted_secret = opts.blob.encryptSecret(opts.keys.unlock, opts.masterkey);

      const recoveryKey = Utils.createRecoveryKey(opts.blob.data.email, opts.blob.data.phone);

      const config = {
        method : 'POST',
        url    : `${opts.url}/v1/blob/${opts.blob.id}/phone/verify`,
        data   : {
          country_code      : opts.blob.data.phone.countryCode,
          phone_number      : opts.blob.data.phone.phoneNumber,
          token             : opts.token,
          data              : opts.blob.encrypt(),
          revision          : opts.blob.revision,
          encrypted_secret  : opts.blob.encrypted_secret,
          encrypted_blobdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.crypt),
          encrypted_secretdecrypt_key : BlobObj.encryptBlobCrypt(recoveryKey, opts.keys.unlock),
        },
      };

      request.post(config.url)
        .send(config.data)
        .end((err, resp) => {
          if (err) {
            reject(err);
          } else if (resp.body && resp.body.result === 'success') {
            resolve(resp.body);
          } else if (resp.body && resp.body.result === 'error') {
            reject(new Error(resp.body.message));
          } else {
            reject(new Error('Unable to request phone token.'));
          }
        });
    });
  },

};

export default BlobClient;
