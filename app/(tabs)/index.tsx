import {ScrollView, Text, TextInput, View} from 'react-native';
import "@/assets/css/global.css"

import { Image } from 'expo-image';
import {useCallback, useEffect, useRef, useState} from "react";
import Peer, {DataConnection} from "peerjs";
import {Button} from "@/components/ui/Button";

type ConnectionStatus = 'initial'|'open' |'closed';
type GameNotification = { type: 'paused' } | { type: 'resumed' };

export default function HomeScreen() {
  const [hostId, setHostId] = useState<string>();
  const [username, setUsername] = useState<string>();
  const peerRef = useRef<Peer>(null);
  const connRef = useRef<DataConnection>(null);

  const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');
  const [isPaused, setIsPaused] = useState<boolean>(true);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('disconnected', (id) => console.log('peer disconnected: ', id));
    peer.on('close', () => console.log('peer closed'));
    peer.on('error', (error) => console.log('peer error', error));

    return () => {
      peer.destroy();
    };
  }, []);

  const connect = useCallback(() => {
    if(!peerRef.current || !hostId || !username) {
      return;
    }

    console.log('PEER', peerRef);

    const conn = peerRef.current.connect(`COWCH-${hostId}`);

    conn.on('open', function () {
      connRef.current = conn;
      conn.send({
        type: 'join',
        payload: username,
      });

      setConnStatus('open');


      conn.on('data', (data: unknown) => {
        const action = data as GameNotification;

        if(action.type === 'paused') {
          setIsPaused(true);
        }
        if(action.type === 'resumed') {
          setIsPaused(false);
        }
      })
    });

    conn.on('close', () => setConnStatus('closed'))


  }, [hostId, username]);

  const requestPause = useCallback(() => {
    if (!connRef.current) {
      return;
    }

    connRef.current.send({
      type: 'pause',
    })
  }, [])

  type Direction = 'up'|'down'|'right'|'left';
  const move = useCallback((direction: Direction) => {
    if(!connRef.current) {
      return;
    }
    connRef.current.send({
      type: 'move',
      payload: direction,
    });
  }, []);

  return (
    <ScrollView className="bg-white">
      <View className="px-4 py-8 flex gap-8">
        <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]" />

        <View>
          <Text className="font-bold text-lg">Lobby Code</Text>
          <TextInput onChangeText={(value) => setHostId(value)} className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded" />

          <Text className="font-bold text-lg">Username</Text>
          <TextInput onChangeText={(value) => setUsername(value)} className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded" />

          <View className="mb-8">
            <Button onPress={connect} disabled={(!hostId || !username) || connStatus ==='open'}>
                Connect
            </Button>
          </View>


          <View className="mb-16">
            <Button onPress={requestPause} disabled={!connRef.current}>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </View>

          <View className="flex gap-2 mb-16">
            <Button onPress={() => move('up')} disabled={!connRef.current || isPaused} className="h-32">
              Up
            </Button>
            <View className="flex gap-2 flex-row flex-nowrap justify-between">
              <View className="grow">

                <Button onPress={() => move('left')} disabled={!connRef.current || isPaused} className="h-32">
                    Left
                </Button>
              </View>
              <View className="grow">
                <Button onPress={() => move('right')} disabled={!connRef.current || isPaused} className="h-32">
                    Right
                </Button>
              </View>
            </View>
            <Button onPress={() => move('down')} disabled={!connRef.current || isPaused} className="h-32">
                Down
            </Button>
          </View>

          {/*<Text>*/}
          {/*  Edit <Text>app/(tabs)/index.tsx</Text> to see changes.*/}
          {/*  Press{' '}*/}
          {/*  <Text>*/}
          {/*    {Platform.select({*/}
          {/*      ios: 'cmd + d',*/}
          {/*      android: 'cmd + m',*/}
          {/*      web: 'F12',*/}
          {/*    })}*/}
          {/*  </Text>{' '}*/}
          {/*  to open developer tools.*/}
          {/*</Text>*/}
        </View>

      </View>

    </ScrollView>
  );
}
