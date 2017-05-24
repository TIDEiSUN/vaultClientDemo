import React from 'react';
import { Link } from 'react-router';
import { VaultClient, Utils } from '../logics';
import AsyncButton from './common/AsyncButton';

function PersonalDataForm(props) {
  const self = props.self;
  return (
    <form>
      <div>
        <label>
          First Name: 
          <input type="text" value={self.state.firstname} onChange={self.handleChange.bind(self, 'firstname')} />
        </label>
        <label>
          Last Name: 
          <input type="text" value={self.state.lastname} onChange={self.handleChange.bind(self, 'lastname')} />
        </label>
      </div>
      <AsyncButton
        type="button"
        onClick={self.handleSubmitForm}
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
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          this.setState({ loginInfo });
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get login info');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
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

  handleChange(name, event) {
    this.setState({ [name]: event.target.value });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = (
        <PersonalDataForm self={this} />
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
