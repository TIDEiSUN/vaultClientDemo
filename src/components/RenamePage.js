import React from 'react';
import { Link } from 'react-router';
import { VaultClientDemo } from '../logics'
import { CurrentLogin } from './Data'
import AsyncButton from './common/AsyncButton'

export default class RenamePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUsername: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(name, event) {
    this.setState({[name]: event.target.value});
  }

  handleSubmit(event) {
    console.log('Handle rename account');
    return VaultClientDemo.renameAccount(CurrentLogin.loginInfo.username, this.state.newUsername, null, CurrentLogin.loginInfo)
      .then(result => {
        console.log('rename', result);
        CurrentLogin.loginInfo = result.loginInfo;
        alert('Success!');
      }).catch(err => {
        console.error('Failed to rename account:', err);
        alert('Failed to rename account: ' + err.message);
        throw err;
      });
    //event.preventDefault();
  }

  render() {
    return (
      <div className="home">
        <h1>Change Username</h1>
        <form>
          <div>
            <label>
              New username: 
              <input type="text" value={this.state.newUsername} onChange={this.handleChange.bind(this, 'newUsername')} />
            </label>
          </div>
          <AsyncButton
           type="button"
           onClick={this.handleSubmit}
           pendingText="Changing..."
           fulFilledText="Changed"
           rejectedText="Failed! Try Again"
           text="Change"
          />
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}