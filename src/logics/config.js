let rippleTxtDomain = 'localhost:3000';
let emailVerify_host = 'http://localhost:3000';
let isunpayrpc_host = 'localhost';
let isunpayrpc_port = 27184;

if (process.env.NODE_ENV === 'production') {
  rippleTxtDomain = '14.136.246.165:3000';
  emailVerify_host = 'http://14.136.246.165:3000';
}

exports.rippleRPC = 'wss://s.altnet.rippletest.net:51233';

// Domain to request ripple.txt
exports.rippleTxtDomain = rippleTxtDomain;

// URL to activate account
exports.accountActivationURL = emailVerify_host + '/activate';

// URL to verify email token
exports.emailVerificationURL = emailVerify_host + '/verifyEmail';

exports.isunpayrpcURL = 'http://' + isunpayrpc_host + ':' + isunpayrpc_port;
