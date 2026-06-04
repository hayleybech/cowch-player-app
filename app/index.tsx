import {Text, TextInput, useWindowDimensions, View} from 'react-native';
import "@/assets/css/global.css"

import {useCallback, useContext, useEffect, useState} from "react";
import Peer, {makePeerHeartbeater} from "@/utils/peer-util";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import {ScreenPropsContext} from "@/app/_layout";
import classNames from "classnames";

export default function LobbyScreen() {
    const props = useContext(ScreenPropsContext);
    const [hostId, setHostId] = useState<string>(props.hostIdRef?.current || '');
    const [username, setUsername] = useState<string>(props.usernameRef?.current || '');

    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const router = useRouter();

    useEffect(() => {
        if (!props.peerRef) {
            return;
        }

        const peer = new Peer();
        props.peerRef.current = peer;

        peer.on('open', (id: string) => {
            console.log('broker ready');

            props.heartbeatRef.current = makePeerHeartbeater(peer);
        });
        peer.on('disconnected', (id: string) => console.log('broker disconnected: ', id));
        peer.on('closed', () => console.log('broker closed'));
        peer.on('error', (error: string) => console.error('broker error', error));

        return () => {
            peer.destroy();

            props.heartbeatRef.current.stop();
        };
    }, [props.heartbeatRef, props.peerRef]);

    useEffect(() => {
        props.onDataCallbackRef.current = (data: any) => {
            if (data?.type === 'player_joined') {
                router.navigate('/breed-selection');
            }
        };
    }, [props.onDataCallbackRef, router]);

    const connect = useCallback(() => {
        if (!props.peerRef?.current || !hostId || !username) {
            return;
        }

        props.hostIdRef.current = hostId;
        props.usernameRef.current = username;

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);

        conn.on('open', function () {
            console.log('host connection opened');

            props.connRef.current = conn;
            conn.on('data', props.onDataRef.current);

            conn.send({
                type: 'connect',
                payload: {username},
            })

            props.hasConnectedRef.current = true;
        });


        conn.on('error', (error: string) => {
            console.log('host connection error', error);
        });
        conn.on('disconnected', () => {
            console.log('host disconnected');
        });
        conn.on('close', () => {
            console.log('host closed');
        });

    }, [hostId, props.connRef, props.hasConnectedRef, props.hostIdRef, props.onDataRef, props.peerRef, props.usernameRef, username]);

    return (
        <View className="bg-neutral-800 flex-1">
            <View className="flex">
                <View className="flex justify-center items-center h-full">
                    <View className={classNames('flex-col p-4', isLandscape ? 'w-1/2' : 'w-full')}>
                        <View className="mb-4">
                            <Text className="text-white text-7xl italic font-pixel-chip text-shadow">cowch</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-lg text-white font-pixel-chip text-shadow-lg">
                                <Text className="text-gray-300">Open a lobby at </Text>
                                <Text className="text-2xl">cowch.laravel.cloud</Text>
                            </Text>
                        </View>

                        <Text className="text-xl text-white font-pixel-chip text-shadow">Lobby Code</Text>
                        <TextInput
                            onChangeText={(value) => {
                                const upperValue = value.toUpperCase();
                                setHostId(upperValue);
                                props.hostIdRef.current = upperValue;
                            }}
                            value={hostId}
                            autoCapitalize="characters"
                            maxLength={4}
                            className="mb-4 text-xl text-white text-shadow font-pixel-chip border border-neutral-400 py-0.5 px-2 focus:border-white [outline:none!important]"
                        />

                        <Text className="text-xl text-shadow font-pixel-chip text-white">Username</Text>
                        <TextInput
                            onChangeText={(value) => {
                                setUsername(value);
                                props.usernameRef.current = value;
                            }}
                            maxLength={8}
                            defaultValue={username}
                            className="mb-4 text-xl text-shadow font-pixel-chip border border-neutral-400 text-white py-0.5 px-2 focus:border-white [outline:none!important]"
                        />

                        <View className="mb-3">
                            <Button onPress={connect} disabled={!hostId || !username}>
                                <Text className="text-2xl text-shadow font-pixel-chip">
                                    Connect
                                </Text>
                            </Button>

                        </View>

                    </View>

                    <View className="left-0 right-0 flex items-center">
                        <Text className="text-neutral-200 text-lg text-shadow font-pixel-chip">www.hayleybech.me</Text>
                    </View>

                </View>
            </View>
        </View>
    );
}
