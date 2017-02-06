import VaultClient, { AuthInfo, Utils } from './vault-client-src/';
import Config from '../../config';

class VaultClientDemoClass {
  constructor() {
    // initialize vault client with a domain
    this.domain = Config.rippleTxtDomain;
    this.client = new VaultClient(this.domain);
  }

  loginAccount(username, password) {
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

  resendVerificationEmail(username, password, email, activateLink, loginInfo, notifyChange) {
    const options = {
      url: loginInfo.blob.url,
      id: loginInfo.blob.id,
      username: username,
      account_id: loginInfo.blob.data.account_id,
      email: email,
      activateLink: activateLink,
      masterkey: loginInfo.secret,
      notify_change: notifyChange,
    };
    return this.client.resendEmail(options);
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
    const options = {
      username: username,
      new_username: newUsername,
      password: password,
      masterkey: loginInfo.secret,
      blob: loginInfo.blob,
    };
    return this.client.rename(options);
  }

  changePassword(username, newPassword, loginInfo) {
    const options = {
      username: username,
      password: newPassword,
      masterkey: loginInfo.secret,
      blob: loginInfo.blob,
    };
    return this.client.changePassword(options);
  }

  renameAndChangePassword(username, newUsername, newPassword, loginInfo) {
    const options = {
      username: username,
      new_username: newUsername,
      password: newPassword,
      masterkey: loginInfo.secret,
      blob: loginInfo.blob,
    };
    return this.client.rename(options);
  }

  updateEmail(username, newUsername, newPassword, loginInfo, email) {
    const options = {
      username: username,
      new_username: newUsername,
      password: newPassword,
      masterkey: loginInfo.secret,
      blob: loginInfo.blob,
      email: email,
    };
    return this.client.updateEmail(options);
  }

  updatePhone(username, newUsername, newPassword, loginInfo, phone) {
    const options = {
      username: username,
      new_username: newUsername,
      password: newPassword,
      masterkey: loginInfo.secret,
      blob: loginInfo.blob,
      phone: phone,
    };
    return this.client.updatePhone(options);
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
    const options = {
      masterkey: loginInfo.secret,
      enabled: enable,
    };
    return loginInfo.blob.set2FA(options);
  }

  sendPhoneVerificationCode(loginInfo, countryCode, phoneNumber, notifyChange = false) {
    const options = {
      url: loginInfo.blob.url,
      blob_id: loginInfo.blob.id,
      account_id: loginInfo.blob.data.account_id,
      masterkey: loginInfo.secret,
      phone_number: phoneNumber,
      country_code: countryCode,
      notify_change: notifyChange,
    };
    return this.client.requestPhoneToken(options);
  }

  verifyPhone(loginInfo, phoneToken, username, phone) {
    const options = {
      username: username,
      phone: phone,
      token: phoneToken,
      blob: loginInfo.blob,
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
          secret: recovered.secret,
          username: authInfo.username,
          emailVerified: authInfo.emailVerified,
          phoneVerified: authInfo.phoneVerified,
        });
      });
  }
}

const VaultClientDemo = new VaultClientDemoClass();
export default VaultClientDemo;
export { Utils };
