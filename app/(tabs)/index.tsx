import {Button, ScrollView, Text, TextInput, View} from 'react-native';
import "@/assets/css/global.css"

import { Image } from 'expo-image';
import {useCallback, useEffect, useRef, useState} from "react";
import Peer, {DataConnection} from "peerjs";

type ConnectionStatus = 'initial'|'open' |'closed';

export default function HomeScreen() {
  const [hostId, setHostId] = useState<string>();
  const [username, setUsername] = useState<string>();
  const peerRef = useRef<Peer>(null);
  const connRef = useRef<DataConnection>(null);

  const [status, setStatus] = useState<ConnectionStatus>('initial');

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, []);

  const connect = useCallback(() => {
    if(!peerRef.current || !hostId || !username) {
      return;
    }

    const conn = peerRef.current.connect(hostId);

    conn.on('open', function () {
      connRef.current = conn;
      conn.send({
        type: 'join',
        payload: username,
      });

      setStatus('open');
    });

    conn.on('close', () => setStatus('closed'))


  }, [hostId, username]);

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
          <Text className="font-bold text-lg">Enter the host ID</Text>
          <TextInput onChangeText={(value) => setHostId(value)} className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded" />

          <Text className="font-bold text-lg">Enter a username</Text>
          <TextInput onChangeText={(value) => setUsername(value)} className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded" />

          <View className="mb-16">
            <Button title="Connect" onPress={connect} color="#9ae600" disabled={(!hostId || !username) || status ==='open'}  />
          </View>

          <View className="flex gap-2">
            <Button title="Up" onPress={() => move('up')} color="#9ae600" disabled={!connRef.current} />
            <View className="flex gap-2 flex-row flex-nowrap justify-between">
              <View className="grow">
                <Button title="Left" onPress={() => move('left')} color="#9ae600" disabled={!connRef.current} />
              </View>
              <View className="grow">
                <Button title="Right" onPress={() => move('right')} color="#9ae600" disabled={!connRef.current} />
              </View>
            </View>
            <Button title="Down" onPress={() => move('down')} color="#9ae600" disabled={!connRef.current} />
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
