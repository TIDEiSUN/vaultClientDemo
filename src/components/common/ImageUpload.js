import React from 'react';

export default class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: '',
    };
    this.handleImageChange = this.handleImageChange.bind(this);
  }

  handleImageChange(event) {
    event.preventDefault();

    const reader = new FileReader();
    const file = event.target.files[0];

    reader.onloadend = () => {
      this.setState({
        file,
      });
      this.props.onImageChange(this.props.name, file);
    };

    reader.readAsDataURL(file);
  }

  render() {
    return (
      <div>
        {this.props.title}:
        <input type="file" onChange={this.handleImageChange} />
      </div>
    );
  }
}
