import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils } from '../logics';

function PhoneInfoDiv(props) {
  if (!props.phone) {
    return null;
  }

  const maskedPhone = Utils.maskphone(props.phone.phoneNumber);

  return (
    <div>
      Phone number: {props.phone.countryCode} {maskedPhone}
      [{props.verified?'Verified':'Not verified'}]
      [{props.hasEnabled?'2FA enabled':'2FA disabled'}]
    </div>
  );
}

export default class TwoFactorAuthPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: false,
      hasEnabled: false,
      phone: null,
      verified: false,
    };
    this.handleSubmitSet = this.handleSubmitSet.bind(this);
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          this.setState({
            loginInfo,
            phone: blob.data.phone,
            verified: Utils.checkPhoneVerified(blob.account_level),
          });
          return loginInfo;
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get login info');
        });
    };
    const get2FAInfo = (loginInfo) => {
      return VaultClient.get2FAInfo(loginInfo)
        .then((info) => {
          this.setState({
            hasEnabled: info.enabled,
          });
        })
        .catch((err) => {
          console.error('get2FAInfo', err);
          alert('Failed to get 2FA info');
        });
    };
    const promise = getLoginInfo()
      .then(loginInfo => get2FAInfo(loginInfo));
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  handleSubmitSet(event) {
    console.log('Handle set 2FA');

    const phone = this.state.phone;
    if (phone.phoneNumber && phone.countryCode) {
      VaultClient.set2FAInfo(this.state.loginInfo,
                                 this.state.enabled,
                                 phone)
        .then((result) => {
          console.log('set 2fa:', result);
          this.setState({
            hasEnabled: result.enabled,
          });
          alert('Success!');
        }).catch((err) => {
          console.error('Failed to set 2FA :', err);
          alert(`Failed to set 2FA: ${err.message}`);
        });
    }
    event.preventDefault();
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = (
        <form onSubmit={this.handleSubmitSet}>
          <div>
            <label>
              Enable 2FA:
              <input type="checkbox" value={this.state.enabled} onChange={this.handleChangeChk.bind(this, 'enabled')} />
            </label>
            <input type="submit" value="Submit" />
          </div>
        </form>
      );
    }
    return (
      <div className="home">
        <h1>Set 2FA Enable</h1>
        <PhoneInfoDiv phone={this.state.phone} verified={this.state.verified} hasEnabled={this.state.hasEnabled} />
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
