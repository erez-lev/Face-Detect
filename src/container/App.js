import React from 'react';
import './App.css';
import Nav from '../components/Nav/Nav.js';
import SignIn from '../components/SignIn/SignIn.js';
import Register from '../components/Register/Register.js';
import Logo from '../components/Logo/Logo.js';
import Rank from '../components/Rank/Rank.js';
import ImageLinkForm from "../components/ImageLinkForm/ImageLinkForm.js";
import FaceRecognition from '../components/FaceRecognition/FaceRecognition.js'
import Particles from 'react-particles-js'; 
import Clarifai from 'clarifai';

const serverApiUrl = 'http://localhost:3001';

const app = new Clarifai.App({
  apiKey: '1276a5f895884a878bd9eb089c368f18'
})

const particalOptions = {
  particles: {
    line_linked: {
      shadow: {
        enable: true,
        color: "#3CA9D1",
        blur: 5
      }
    }
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: "",
        email: "",
        entries: 0,
        joinDate: ''
      }
    }
  }

  loadUser = (data) => {
    this.setState({
      user: {
          id: data.id,
          name: data.name,
          email: data.email,
          entries: data.entries,
          joinDate: data.joinDate
      }
    });

    console.log('loadusers: name = ', this.state.user.name);
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({ box: box });
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  }

  onButtonSubmit = (event) => {
    this.setState({ imageUrl: this.state.input });
    app.models.predict(
       Clarifai.FACE_DETECT_MODEL,
       this.state.input)
       .then(response =>  {
         if (response) {
           fetch(serverApiUrl + '/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: this.state.user.id
            })
           })
           .then(response => response.json())
           .then(count => {
             this.setState(Object.assign(this.state.user, { entries: count }));
           });
         }

         this.displayFaceBox(this.calculateFaceLocation(response))
       })
       .catch(err => console.log('catch block error: ', err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({ isSignedIn: false });
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }

    this.setState({ route: route });
  }

  render() {
    return (
      <div className="App">
        <Particles className="particles" params={particalOptions} />
        <Nav onRouteChange={this.onRouteChange} isSignedIn={this.state.isSignedIn} />
        { this.state.route === 'home' 
          ? <div> 
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit} />
              <FaceRecognition imageUrl={this.state.imageUrl} box={this.state.box} />
            </div>
          : this.state.route === 'signin' 
          ? <SignIn onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
          : <Register onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
          }
      </div>
    );
  }
}

export default App;
