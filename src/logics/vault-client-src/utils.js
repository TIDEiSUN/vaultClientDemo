export default {
  createRecoveryKey(email, phone = null) {
    let recoveryKey = `@@@RecoveR!!!!!${email}!!`;
    if (phone) {
      recoveryKey += `(${phone.countryCode})${phone.phoneNumber}!`;
    }
    return recoveryKey;
  },

  maskphone(phone) {
    if (!phone) {
      return '';
    }
    const first = phone.substr(0, phone.length - 4).replace(/\d/g,'*');
    const last = phone.substr(-4);
    return first.concat(last);
  },
};
