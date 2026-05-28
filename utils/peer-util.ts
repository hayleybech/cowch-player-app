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

export function makePeerHeartbeater ( peer: typeof Peer ) {
  let timeoutId = 0;
  function heartbeat () {
    timeoutId = setTimeout( heartbeat, 20000 );
    if ( peer.socket._wsOpen() ) {
      peer.socket.send( {type:'HEARTBEAT'} );
    }
  }
  // Start
  heartbeat();
  // return
  return {
    start : function () {
      if ( timeoutId === 0 ) { heartbeat(); }
    },
    stop : function () {
      clearTimeout( timeoutId );
      timeoutId = 0;
    }
  };
}