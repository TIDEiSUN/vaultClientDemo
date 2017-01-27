import VaultClient, { AuthInfo } from './vault-client-src/';
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

  resendVerificationEmail(username, password, email, activateLink, loginInfo) {
    const options = {
      url: loginInfo.blob.url,
      id: loginInfo.blob.id,
      username: username,        // loginInfo.username
      account_id: loginInfo.blob.data.account_id,
      email: email === null ? loginInfo.blob.data.email : email,
      activateLink: activateLink,
      masterkey: loginInfo.secret,
    };
    return this.client.resendEmail(options);
  }

  verifyEmailToken(username, emailToken) {
    return this.client.verify(username, emailToken);
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

  sendPhoneVerificationCode(loginInfo, countryCode, phoneNumber) {
    const options = {
      url: loginInfo.blob.url,
      blob_id: loginInfo.blob.id,
      account_id: loginInfo.blob.data.account_id,
      masterkey: loginInfo.secret,
      phone_number: phoneNumber,
      country_code: countryCode,
    };
    return this.client.requestPhoneToken(options);
  }

  verifyPhone(loginInfo, token) {
    const options = {
      url: loginInfo.blob.url,
      blob_id: loginInfo.blob.id,
      token: token,
    };
    return this.client.verifyPhoneToken(options);
  }

  recoverBlob(username, rippleSecret) {
    const authInfoPromise = AuthInfo.get(this.domain, username);

    const recoverBlobPromise = authInfoPromise
      .then((authInfo) => {
        const options = {
          url: authInfo.blobvault,
          username: authInfo.username,
          masterkey: rippleSecret,
        };
        return this.client.recoverBlob(options);
      });

    return Promise.all([authInfoPromise, recoverBlobPromise])
      .then((results) => {
        const [authInfo, blob] = results;
        return Promise.resolve({
          blob: blob,
          secret: rippleSecret,
          username: authInfo.username,
          verified: authInfo.emailVerified, // DEPRECIATE
          emailVerified: authInfo.emailVerified,
          profileVerified: authInfo.profile_verified,
          identityVerified: authInfo.identity_verified,
        });
      });
  }
}

const VaultClientDemo = new VaultClientDemoClass();
export default VaultClientDemo;
