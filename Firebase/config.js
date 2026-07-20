
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";


const firebaseConfig = {
  apiKey: "AIzaSyBzDQXCg6CLVPgn3_NUOBVzOavcLkfITb0",
  authDomain: "wherearemybills.firebaseapp.com",
  projectId: "wherearemybills",
  storageBucket: "wherearemybills.appspot.com",
  messagingSenderId: "881244911046",
  appId: "1:881244911046:web:649611b650cdf5efb32ec7"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { firebase }

