import VaultClient, { AuthInfo, Utils, Blob as BlobObj, CustomKeys } from './vault-client-src/';
import Config from './config';

class VaultClientDemoClass {
  constructor() {
    // initialize vault client with a domain
    this.domain = Config.rippleTxtDomain;
    this.client = new VaultClient(this.domain);
  }

  loginAccount(username, password) {
    return this.client.login(username, password)
      .then((res) => {
        return Promise.resolve(res);
      });
  }

  unlockAccount(loginInfo) {
    if (loginInfo.secret) {
      return Promise.resolve(loginInfo);
    }
    console.log('unlock: new login info');
    const newLoginInfo = this.deserializeLoginInfo(this.serializeLoginInfo(loginInfo));
    return this.client.unlock(newLoginInfo.blob.encrypted_secret, newLoginInfo.customKeys)
      .then((result) => {
        newLoginInfo.secret = result.secret;
        return Promise.resolve(newLoginInfo);
      });
  }

  loginAndUnlockAccount(username, password) {
    return this.client.loginAndUnlock(username, password)
      .then((res) => {
        // exclude property unlock in the resolve result
        const {
          unlock,
          ...resRest
        } = res;
        return Promise.resolve(unlock !== undefined ? resRest : res);
      });
  }

  requestEmailTokenForRecovery(url, username, email, activateLink) {
    const options = {
      url: url,
      username: username,
      email: email,
      activateLink: activateLink,
    };
    return this.client.requestEmailTokenForRecovery(options);
  }

  resendVerificationEmail(username, password, email, activateLink, loginInfo) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        const options = {
          url: unlockedLoginInfo.blob.url,
          blob_id: unlockedLoginInfo.blob.id,
          username: username,
          account_id: unlockedLoginInfo.blob.data.account_id,
          email: email,
          activateLink: activateLink,
          masterkey: unlockedLoginInfo.secret,
        };
        return this.client.resendEmail(options)
          .then((result) => {
            return Promise.resolve({ ...result, loginInfo: unlockedLoginInfo });
          });
      });
  }

  verifyEmailToken(username, emailToken, email) {
    const options = {
      username: username,
      email: email,
      token: emailToken,
    };
    return this.client.verifyEmailToken(options);
  }

  renameAccount(username, newUsername, password, loginInfo) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        if (unlockedLoginInfo === loginInfo) {
            console.log('rename: new login info');
        }
        const newLoginInfo = unlockedLoginInfo === loginInfo ? this.deserializeLoginInfo(this.serializeLoginInfo(loginInfo)) : unlockedLoginInfo;
        const options = {
          username: username,
          new_username: newUsername,
          password: password,
          masterkey: newLoginInfo.secret,
          blob: newLoginInfo.blob,
          customKeys: newLoginInfo.customKeys,
        };
        return this.client.rename(options)
          .then((resolved) => {
            newLoginInfo.username = newUsername;
            return Promise.resolve({ ...resolved, loginInfo: newLoginInfo });
          });
      });
  }

  changePassword(username, newPassword, loginInfo) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        if (unlockedLoginInfo === loginInfo) {
            console.log('change password: new login info');
        }
        const newLoginInfo = unlockedLoginInfo === loginInfo ? this.deserializeLoginInfo(this.serializeLoginInfo(loginInfo)) : unlockedLoginInfo;
        const options = {
          username: username,
          password: newPassword,
          masterkey: newLoginInfo.secret,
          blob: newLoginInfo.blob,
          customKeys: newLoginInfo.customKeys,
        };
        return this.client.changePassword(options)
          .then((resolved) => {
            return Promise.resolve({ ...resolved, loginInfo: newLoginInfo });
          });
      });
  }

  updateEmail(username, newUsername, newPassword, loginInfo, email) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        if (unlockedLoginInfo === loginInfo) {
            console.log('update email: new login info');
        }
        const newLoginInfo = unlockedLoginInfo === loginInfo ? this.deserializeLoginInfo(this.serializeLoginInfo(loginInfo)) : unlockedLoginInfo;
        const options = {
          username: username,
          new_username: newUsername,
          password: newPassword,
          masterkey: newLoginInfo.secret,
          blob: newLoginInfo.blob,
          customKeys: newLoginInfo.customKeys,
          email: email,
        };
        return this.client.updateEmail(options)
          .then((resolved) => {
            newLoginInfo.username = newUsername;
            newLoginInfo.emailVerified = true;
            return Promise.resolve({ ...resolved, loginInfo: newLoginInfo });
          });
      });
  }

  updatePhone(username, newUsername, newPassword, loginInfo, phone) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        if (unlockedLoginInfo === loginInfo) {
            console.log('update phone: new login info');
        }
        const newLoginInfo = unlockedLoginInfo === loginInfo ? this.deserializeLoginInfo(this.serializeLoginInfo(loginInfo)) : unlockedLoginInfo;
        const options = {
          username: username,
          new_username: newUsername,
          password: newPassword,
          masterkey: newLoginInfo.secret,
          blob: newLoginInfo.blob,
          customKeys: newLoginInfo.customKeys,
          phone: phone,
        };
        return this.client.updatePhone(options)
          .then((resolved) => {
            newLoginInfo.username = newUsername;
            newLoginInfo.phoneVerified = true;
            return Promise.resolve({ ...resolved, loginInfo: newLoginInfo });
          });
      });
  }

  registerAccount(username, password, email, activateLink) {
    const options = {
      username: username,
      password: password,
      email: email,
      activateLink: activateLink,
      domain: this.domain,
    };
    return this.client.register(options);
  }

  get2FAInfo(loginInfo) {
    return loginInfo.blob.get2FA();
  }

  set2FAInfo(loginInfo, enable) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        const options = {
          masterkey: unlockedLoginInfo.secret,
          enabled: enable,
        };
        return unlockedLoginInfo.blob.set2FA(options)
          .then((result) => {
            return Promise.resolve({ ...result, loginInfo: unlockedLoginInfo });
          });
      });
  }

  requestPhoneTokenForRecovery(url, username, countryCode, phoneNumber) {
    const options = {
      url: url,
      username: username,
      country_code: countryCode,
      phone_number: phoneNumber,
    };
    return this.client.requestPhoneTokenForRecovery(options);
  }

  sendPhoneVerificationCode(loginInfo, countryCode, phoneNumber, username) {
    return this.unlockAccount(loginInfo)
      .then((unlockedLoginInfo) => {
        const options = {
          url: unlockedLoginInfo.blob.url,
          blob_id: unlockedLoginInfo.blob.id,
          username: username,
          account_id: unlockedLoginInfo.blob.data.account_id,
          masterkey: unlockedLoginInfo.secret,
          phone_number: phoneNumber,
          country_code: countryCode,
        };
        return this.client.requestPhoneToken(options)
          .then((result) => {
            return Promise.resolve({ ...result, loginInfo: unlockedLoginInfo });
          });
      });
  }

  verifyPhone(phoneToken, username, phone) {
    const options = {
      username: username,
      phone: phone,
      token: phoneToken,
    };
    return this.client.verifyPhoneToken(options);
  }

  recoverBlob(email, phone) {
    const dummyUsername = 'dummy';
    const recoverBlobPromise = AuthInfo.get(this.domain, dummyUsername)
      .then((authInfo) => {
        const options = {
          url: authInfo.blobvault,
          email: email,
          phone: phone,
        };
        return this.client.recoverBlob(options);
      });

    const authInfoPromise = recoverBlobPromise
      .then((recovered) => {
        return AuthInfo.get(this.domain, recovered.username);
      });

    return Promise.all([recoverBlobPromise, authInfoPromise])
      .then((results) => {
        const [recovered, authInfo] = results;

        return Promise.resolve({
          blob: recovered.blob,
          customKeys: new CustomKeys(authInfo, null),
          secret: recovered.secret,
          username: authInfo.username,
          emailVerified: authInfo.emailVerified,
          phoneVerified: authInfo.phoneVerified,
        });
      });
  }

  getAuthInfoByEmail(email) {
    return AuthInfo.getByEmail(this.domain, email);
  }

  serializeLoginInfo(loginInfo) {
    return JSON.stringify(loginInfo);
  }

  deserializeLoginInfo(str) {
    const strData = JSON.parse(str);
    if (!Object.prototype.hasOwnProperty.call(strData, 'blob')) {
      return strData;
    }

    const {
      blob,
      customKeys,
      ...strDataRest
    } = strData;

    const blobObj = BlobObj.deserialize(blob);
    const customKeysObj = CustomKeys.deserialize(customKeys);

    return { blob: blobObj, customKeys: customKeysObj, ...strDataRest };
  }
}

const VaultClientDemo = new VaultClientDemoClass();
export default VaultClientDemo;
export { Utils };
