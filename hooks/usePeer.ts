import { Platform } from 'react-native';

let Peer: any;

if (Platform.OS === 'web') {
  Peer = require('peerjs').default;
} else {
  Peer = require('react-native-peerjs').default;
}

export const registerWebRTCGlobals = () => {
  if (Platform.OS !== 'web') {
    const { registerGlobals } = require('react-native-webrtc');
    registerGlobals();
  }
};

export default Peer;
