// Domain to request ripple.txt
if(process.env.NODE_ENV==='production'){
  exports.rippleRPC = 'wss://s.altnet.rippletest.net:51233';

  exports.rippleTxtDomain = '14.136.246.165:3000';
// URL to activate account
  exports.accountActivationURL = 'http://14.136.246.165:3000/activate';
// URL to verify email token
  exports.emailVerificationURL = 'http://14.136.246.165:3000/verifyEmail';
}
else{
  exports.rippleRPC = 'wss://s.altnet.rippletest.net:51233';

  exports.rippleTxtDomain = 'localhost:3000';  
// URL to activate account
  exports.accountActivationURL = 'http://localhost:3000/activate';
// URL to verify email token
  exports.emailVerificationURL = 'http://localhost:3000/verifyEmail';
}

