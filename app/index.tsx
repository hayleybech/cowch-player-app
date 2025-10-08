import {ScrollView, Text, TextInput, View} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import Peer from "peerjs";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import {ScreenPropsContext} from "@/app/_layout";

type ConnectionStatus = 'initial' | 'open' | 'closed';

export default function LobbyScreen() {
    const [hostId, setHostId] = useState<string>();
    const [username, setUsername] = useState<string>();

    const props = useContext(ScreenPropsContext);

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');

    const router = useRouter();

    useEffect(() => {
        if (!props.peerRef) {
            return;
        }

        const peer = new Peer();
        props.peerRef.current = peer;

        peer.on('disconnected', (id) => console.log('peer disconnected: ', id));
        peer.on('close', () => console.log('peer closed'));
        peer.on('error', (error) => console.error('peer error', error));

        return () => {
            peer.destroy();
        };
    }, [props.peerRef]);

    const connect = useCallback(() => {
        if (!props.peerRef?.current || !hostId || !username) {
            return;
        }

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);

        conn.on('open', function () {
            props.connRef.current = conn;
            conn.send({
                type: 'join',
                payload: username,
            });

            setConnStatus('open');

            router.navigate('/cooow');

            conn.on('data', props.onDataRef.current);
        });

        conn.on('close', () => {
            setConnStatus('closed');
            router.navigate('/');
        })


    }, [hostId, props.connRef, props.onDataRef, props.peerRef, router, username]);


    return (
        <ScrollView className="bg-white">
            <View className="px-4 py-8 flex gap-8">
                <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>

                <View>
                    <Text className="font-bold text-lg">Lobby Code</Text>
                    <TextInput onChangeText={(value) => setHostId(value)}
                               className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                    <Text className="font-bold text-lg">Username</Text>
                    <TextInput onChangeText={(value) => setUsername(value)}
                               className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                    <View className="mb-8">
                        <Button onPress={connect} disabled={(!hostId || !username) || connStatus === 'open'}>
                            Connect
                        </Button>
                    </View>
                </View>

            </View>

        </ScrollView>
    );
}
