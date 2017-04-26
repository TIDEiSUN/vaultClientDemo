let webhost = 'localhost:3000';
let isunpayrpc_host = 'http://localhost:27184';

if (process.env.NODE_ENV === 'staging') {
  isunpayrpc_host = 'https://rpc.tidepay.io';
}

exports.webhost = webhost;
exports.isunpayrpcURL = isunpayrpc_host;

exports.accountActivationURL = `http://${webhost}/activateAccount`;
exports.changeEmailURL = `http://${webhost}/changeemail`;
exports.unblockAccountURL = `http://${webhost}/unblock`;
exports.recoverAccountURL = `http://${webhost}/recover`;
