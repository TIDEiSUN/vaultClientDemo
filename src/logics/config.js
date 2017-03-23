let emailVerify_host = 'http://localhost:3000';
if (process.env.NODE_ENV === 'production') {
  emailVerify_host = 'http://14.136.246.165:3000';
}

// URL to activate account
exports.accountActivationURL = emailVerify_host + '/activateAccount';

// URL to verify email token
exports.emailVerificationURL = emailVerify_host + '/verifyEmail';


//let rippleRPC = 'wss://s.altnet.rippletest.net:51233';
let rippleRPC = 'ws://192.168.100.92:6006';
let isunpayrpc_host = 'localhost';
let isunpayrpc_port = 27184;

if(process.env.NODE_ENV==='production'){
  rippleRPC = 'ws://192.168.100.92:6006';
  isunpayrpc_host = '14.136.246.165';
}

exports.rippleRPC = rippleRPC;
exports.rippleTxtDomain = isunpayrpc_host + ':' + isunpayrpc_port;
exports.isunpayrpcURL = 'http://' + isunpayrpc_host + ':' + isunpayrpc_port;
