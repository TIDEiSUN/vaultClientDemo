import React from 'react';
import { Link } from 'react-router';
import { VaultClient, VCUtils as Utils } from '../logics';
import ImageUpload from './common/ImageUpload';

export default class UploadIDPhotosPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id_photo: null,
      selfie_photo: null,
      loginInfo: null,
    };
    this.onImageChange = this.onImageChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

  onImageChange(name, file) {
    this.setState({
      [name]: file,
    });
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('id_photo', this.state.id_photo);
    formData.append('selfie_photo', this.state.selfie_photo);

    const { loginInfo } = this.state;
    return VaultClient.uploadPhotos(loginInfo, formData)
      .then((result) => {
        console.log('update blob:', result);
        this.setState({ loginInfo: result.loginInfo });
        alert('Updated!');
      }).catch(err => {
        console.error('Failed to update blob:', err);
        alert('Failed to update: ' + err.message);
        throw err;
      });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      childComponents = (
        <form onSubmit={this.handleSubmit}>
          <ImageUpload title="ID Photo" name="id_photo" onImageChange={this.onImageChange} />
          <ImageUpload title="Selfie Photo" name="selfie_photo" onImageChange={this.onImageChange} />
          <button type="submit" onClick={this.handleSubmit}>Upload Image</button>
        </form>
      );
    }
    return (
      <div className="home">
        <h1>Upload ID Photos</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
