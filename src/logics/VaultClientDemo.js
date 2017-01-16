import { VaultClient, AuthInfo } from './vault-client-src/';

const domain = 'localhost:27183';

// initialize vault client with a domain
const client = new VaultClient(domain);

function loginAccount(username, password) {
    return new Promise((resolve, reject) => {
        client.loginAndUnlock(username, password, null, (err, res) => {
            if (err) {
                reject(err);
            } else {
                if (res.hasOwnProperty('unlock')) {
                    delete res.unlock;      // not used
                }
                resolve(res);
            }
        });
    });
}

function resendVerificationEmail(username, password, email, activateLink, loginInfo) {
    return new Promise((resolve, reject) => {
        let options = {
            url          : loginInfo.blob.url,
            id           : loginInfo.blob.id,
            username     : username,        // loginInfo.username
            account_id   : loginInfo.blob.data.account_id,
            email        : email === null ? loginInfo.blob.data.email : email,
            activateLink : activateLink,
            masterkey    : loginInfo.secret
        };
        client.resendEmail(options, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function verifyEmailToken(username, emailToken) {
    return new Promise((resolve, reject) => {
        client.verify(username, emailToken, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function renameAccount(username, newUsername, password, loginInfo) {
    return new Promise((resolve, reject) => {
        let options = {
            username     : username,        // loginInfo.username
            new_username : newUsername,
            password     : password,
            masterkey    : loginInfo.secret,
            blob         : loginInfo.blob
        };
        client.rename(options, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function changePassword(username, newPassword, loginInfo) {
    return new Promise((resolve, reject) => {
        let options = {
            username    : username,         // loginInfo.username
            password    : newPassword,
            masterkey   : loginInfo.secret,
            blob        : loginInfo.blob
        };
        client.changePassword(options, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function registerAccount(username, password, email, activateLink) {
    return new Promise((resolve, reject) => {
        const options = {
            username     : username,
            password     : password,
            email        : email,
            activateLink : activateLink,
            domain       : domain
        }

        client.register(options, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function sendPhoneVerificationCode(username, countryCode, phoneNumber) {
    return new Promise((resolve, reject) => {
        // const options = {
        //     username     : username,
        //     password     : password,
        //     email        : email,
        //     activateLink : activateLink,
        //     domain       : domain
        // }

        // client.register(options, (err, res) => {
        //     if (err) {
        //         reject(err);
        //     } else {
        //         resolve(res);
        //     }
        // });
    });
}

function verifyPhone(username, countryCode, phoneNumber, token) {
    return new Promise((resolve, reject) => {
        // const options = {
        //     username     : username,
        //     password     : password,
        //     email        : email,
        //     activateLink : activateLink,
        //     domain       : domain
        // }

        // client.register(options, (err, res) => {
        //     if (err) {
        //         reject(err);
        //     } else {
        //         resolve(res);
        //     }
        // });
    });
}

function recoverBlob(username, rippleSecret) {
    return new Promise((resolve, reject) => {
        AuthInfo.get(domain, username, (err, authInfo) => {
            let options = {
                url       : authInfo.blobvault,
                username  : authInfo.username,
                masterkey : rippleSecret
            };
            client.recoverBlob(options, (err, blob) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        blob      : blob,
                        //unlock    : unlock,
                        secret    : rippleSecret,
                        username  : authInfo.username,
                        verified  : authInfo.emailVerified, //DEPRECIATE
                        emailVerified    : authInfo.emailVerified,
                        profileVerified  : authInfo.profile_verified,
                        identityVerified : authInfo.identity_verified
                    });
                }
            });
        });
    });
}

exports.loginAccount = loginAccount;
exports.resendVerificationEmail = resendVerificationEmail;
exports.verifyEmailToken = verifyEmailToken;
exports.changePassword = changePassword;
exports.renameAccount = renameAccount;
exports.registerAccount = registerAccount;
exports.sendPhoneVerificationCode = sendPhoneVerificationCode;
exports.verifyPhone = verifyPhone;
exports.recoverBlob = recoverBlob;

// export default class ValutClientDemo {
//     constructor() {
//         this._username = '';
//         this._password = '';
//     }
// }