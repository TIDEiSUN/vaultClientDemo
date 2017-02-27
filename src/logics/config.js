let emailVerify_host = 'http://localhost:3000';
if (process.env.NODE_ENV === 'production') {
  emailVerify_host = 'http://14.136.246.165:3000';
}

// URL to activate account
exports.accountActivationURL = emailVerify_host + '/activateAccount';

// URL to verify email token
exports.emailVerificationURL = emailVerify_host + '/verifyEmail';


