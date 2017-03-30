let webhost = 'localhost:3000';
let rippleRPC = 'wss://s.altnet.rippletest.net:51233';
let isunpayrpc_host = 'localhost';
let isunpayrpc_port = 27184;

if (process.env.NODE_ENV === 'production') {
  webhost = 'http://14.136.246.165:3000';
  rippleRPC = 'ws://192.168.100.92:6006';
  isunpayrpc_host = '14.136.246.165';
}

exports.rippleRPC = rippleRPC;
exports.rippleTxtDomain = `${isunpayrpc_host}:${isunpayrpc_port}`;
exports.isunpayrpcURL = `http://${isunpayrpc_host}:${isunpayrpc_port}`;

exports.accountActivationURL = `http://${webhost}/activateAccount`;
exports.emailVerificationURL = `http://${webhost}/verifyEmail`;
exports.unblockAccountURL = `http://${webhost}/unblock`;
