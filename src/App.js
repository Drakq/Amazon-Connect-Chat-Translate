import React, { Component } from "react";
import Auth from "@aws-amplify/auth";
//import {withAuthenticator} from '@aws-amplify/ui-react';
import awsconfig from "./aws-exports";

import "./App.css";
import 'semantic-ui-less/semantic.less';

import Ccp from "./components/ccp";

Auth.configure(awsconfig);

class App extends Component {
       render() {
              return (
                     <div className="App">
                        <Ccp />
                     </div>
              );
       }
}

//export default withAuthenticator(App)
export default App