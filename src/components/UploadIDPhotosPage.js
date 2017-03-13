import React from 'react';
import { Link } from 'react-router';
import VaultClientDemo from '../logics/VaultClientDemo';
import { CurrentLogin } from './Data';
import ImageUpload from './common/ImageUpload';

export default class UploadIDPhotosPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id_photo: null,
      selfie_photo: null,
    };
    this.onImageChange = this.onImageChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onImageChange(name, file) {
    this.setState({
      [name]: file,
    });
  }

  handleSubmit(event) {
    event.preventDefault();

    const config = {
      headers: { 'content-type': 'multipart/form-data' },
    };
    const formData = new FormData();
    formData.append('id_photo', this.state.id_photo);
    formData.append('selfie_photo', this.state.selfie_photo);
    return VaultClientDemo.uploadPhotos(CurrentLogin.loginInfo, formData, config)
      .then((result) => {
        console.log('update blob:', result);
        CurrentLogin.loginInfo = result.loginInfo;
        alert('Updated!');
      }).catch(err => {
        console.error('Failed to update blob:', err);
        alert('Failed to update: ' + err.message);
        throw err;
      });
  }

  render() {
    return (
      <div className="home">
        <h1>Upload ID Photos</h1>
        <form onSubmit={this.handleSubmit}>
          <ImageUpload title="ID Photo" name="id_photo" onImageChange={this.onImageChange} />
          <ImageUpload title="Selfie Photo" name="selfie_photo" onImageChange={this.onImageChange} />
          <button type="submit" onClick={this.handleSubmit}>Upload Image</button>
        </form>
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
