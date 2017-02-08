import sjcl from './sjcl';

export default {
  createRecoveryKey(email, phone = null) {
    let recoveryKey = `@@@RecoveR!!!!!${email}!!`;
    if (phone) {
      recoveryKey += `(${phone.countryCode})${phone.phoneNumber}!`;
    }
    return recoveryKey;
  },

  createHashedPhone(phone) {
    const phoneStr = `(${phone.countryCode})${phone.phoneNumber}`;
    const hashedBitArray = sjcl.hash.sha256.hash(phoneStr);
    return sjcl.codec.hex.fromBits(hashedBitArray);
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
