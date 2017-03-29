let webhost = 'localhost:3000';
let rippleRPC = 'wss://s.altnet.rippletest.net:51233';
let isunpayrpc_host = 'localhost';
let isunpayrpc_port = 27184;

if (process.env.NODE_ENV === 'production') {
  rippleRPC = 'ws://dx.tidepay.io:6006';
  isunpayrpc_host = 'rpc.tidepay.io';
}

exports.rippleRPC = rippleRPC;
exports.isunpayrpcURL = `http://${isunpayrpc_host}:${isunpayrpc_port}`;

exports.accountActivationURL = `http://${webhost}/activateAccount`;
exports.emailVerificationURL = `http://${webhost}/verifyEmail`;
