import React from 'react';
import { Link } from 'react-router';
import { VaultClient, VCUtils as Utils } from '../logics';
import AsyncButton from './common/AsyncButton';

function PersonalDataForm(props) {
  const { firstname, lastname, onChange, onSubmit } = props;
  return (
    <form>
      <div>
        <label htmlFor="firstname">
          First Name:
        </label>
        <input type="text" id="firstname" name="firstname" value={firstname} onChange={onChange} />
      </div>
      <div>
        <label htmlFor="lastname">
          Last Name:
        </label>
        <input type="text" id="lastname" name="lastname" value={lastname} onChange={onChange} />
      </div>
      <AsyncButton
        type="button"
        onClick={onSubmit}
        pendingText="Updating..."
        fulFilledText="Updated"
        rejectedText="Failed! Try Again"
        text="Update"
      />
    </form>
  );
}

export default class ChangePersonalDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: '',
      lastname: '',
      loginInfo: null,
    };
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    const setLoginInfo = (loginInfo) => {
      this.setState({ loginInfo });
    };
    const promise = VaultClient.getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setLoginInfo)
      .catch((err) => {
        console.error('getLoginInfo', err);
        alert('Failed to get login info');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleSubmitForm() {
    const { loginInfo } = this.state;
    const { username, blob } = loginInfo;

    // update blob
    const newBlob = VaultClient.cloneBlob(blob);
    newBlob.data.firstname = this.state.firstname;
    newBlob.data.lastname = this.state.lastname;

    return VaultClient.updateBlob(username, loginInfo, newBlob)
      .then((result) => {
        console.log('update blob:', result);
        this.setState({ loginInfo: result.loginInfo });
        alert('Updated!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('Failed to update blob:', err);
        alert('Failed to update: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleInputChange(event) {
    const { target } = event;
    const { name, value } = target;
    this.setState({ [name]: value });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      const { firstname, lastname } = this.state;
      childComponents = (
        <PersonalDataForm firstname={firstname} lastname={lastname} onChange={this.handleInputChange} onSubmit={this.handleSubmitForm} />
      );
    }
    return (
      <div className="home">
        <h1>Update Personal Data</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
