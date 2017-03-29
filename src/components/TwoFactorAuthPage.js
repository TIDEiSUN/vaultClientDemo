import React from 'react';
import { Link } from 'react-router';
import { VaultClientDemo, Utils } from '../logics';
import { CurrentLogin } from './Data';

function PhoneInfoDiv(props) {
  if (!props.phone) {
    return null;
  }

  const maskedPhone = Utils.maskphone(props.phone.phoneNumber);

  return (
    <div>
      Phone number: {props.phone.countryCode} {maskedPhone}
      [{props.verified?'Verified':'Not verified'}]
      [{props.enabled?'2FA enabled':'2FA disabled'}]
    </div>
  );
}

export default class TwoFactorAuthPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: false, // TODO value from login info
      phone: CurrentLogin.loginInfo ? CurrentLogin.loginInfo.blob.data.phone : null,
      verified: CurrentLogin.loginInfo ? CurrentLogin.loginInfo.phoneVerified : false,
    };
    this.handleSubmitSet = this.handleSubmitSet.bind(this);
  }

  handleChangeChk(name, event) {
    this.setState({ [name]: event.target.checked });
  }

  handleSubmitSet(event) {
    console.log('Handle set 2FA');

    const phone = this.state.phone;
    if (phone.phoneNumber && phone.countryCode) {
      VaultClientDemo.set2FAInfo(CurrentLogin.loginInfo,
                                 this.state.enabled,
                                 phone)
        .then((result) => {
          console.log('set 2fa:', result);
          this.setState({
            enabled: result.enabled,
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
    return (
      <div className="home">
        <h1>Set 2FA Enable</h1>
        <PhoneInfoDiv phone={this.state.phone} verified={this.state.verified} />
        <form onSubmit={this.handleSubmitSet}>
          <div>
            <label>
              Enable 2FA:
              <input type="checkbox" value={this.state.enabled} onChange={this.handleChangeChk.bind(this, 'enabled')} />
            </label>
            <input type="submit" value="Submit" />
          </div>
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
