let webhost = 'localhost:3000';
let rippleRPC = 'wss://s.altnet.rippletest.net:51233';
let isunpayrpc_host = 'localhost';
let isunpayrpc_port = 27184;

if (process.env.NODE_ENV === 'production') {
  rippleRPC = 'ws://dx.tidepay.io:6006';
  isunpayrpc_host = 'rpc.tidepay.io';
}

exports.webhost = webhost;
exports.rippleRPC = rippleRPC;
exports.rippleTxtDomain = `${isunpayrpc_host}:${isunpayrpc_port}`;
exports.isunpayrpcURL = `http://${isunpayrpc_host}:${isunpayrpc_port}`;

exports.accountActivationURL = `http://${webhost}/activateAccount`;
exports.changeEmailURL = `http://${webhost}/changeemail`;
exports.unblockAccountURL = `http://${webhost}/unblock`;
exports.recoverAccountURL = `http://${webhost}/recover`;
