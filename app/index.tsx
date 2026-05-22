import {Pressable, Text, TextInput, useWindowDimensions, View} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import Peer from "@/hooks/usePeer";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import {ScreenPropsContext} from "@/app/_layout";
import classNames from "classnames";
import {CowBreed} from "@/app/cooow";

type ConnectionStatus = 'initial' | 'open' | 'closed' | 'reconnecting';

export default function LobbyScreen() {
    const props = useContext(ScreenPropsContext);
    const [hostId, setHostId] = useState<string>(props.hostIdRef?.current || '');
    const [username, setUsername] = useState<string>(props.usernameRef?.current || '');
    const [breed, setBreed] = useState<CowBreed>('highland');
    const [availableBreeds, setAvailableBreeds] = useState<string[]>(['holstein-friesian', 'hereford', 'angus', 'highland']);

    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');

    const router = useRouter();

    useEffect(() => {
        if (!props.peerRef) {
            return;
        }

        const peer = new Peer();
        props.peerRef.current = peer;

        peer.on('disconnected', (id: string) => console.log('peer disconnected: ', id));
        peer.on('close', () => console.log('peer closed'));
        peer.on('error', (error: string) => console.error('peer error', error));

        return () => {
            peer.destroy();
        };
    }, [props.peerRef]);

    useEffect(() => {
        props.onDataCallbackRef.current = (data: any) => {
            if (data?.type === 'player_joined') {
                const newAvailableBreeds = data.payload as string[];
                setAvailableBreeds(newAvailableBreeds);

                // Reset breed if no longer available
                setBreed((currentBreed) => {
                    if (!newAvailableBreeds.includes(currentBreed)) {
                        if (newAvailableBreeds.length > 0) {
                            return newAvailableBreeds[0] as CowBreed;
                        }
                    }
                    return currentBreed;
                });
            }
            if (data?.type === 'joined') {
                router.navigate('/cooow');
            }
        };
    }, [props.onDataCallbackRef, router]);

    const join = useCallback(() => {
        if (!props.connRef.current || !username || !breed) {
            return;
        }

        props.connRef.current.send({
            type: 'join',
            payload: {breed},
        });
    }, [breed, props.connRef, username]);

    const connect = useCallback(() => {
        if (!props.peerRef?.current || !hostId || !username) {
            return;
        }

        props.hostIdRef.current = hostId;
        props.usernameRef.current = username;

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);

        conn.on('open', function () {
            props.connRef.current = conn;
            conn.on('data', props.onDataRef.current);

            conn.send({
                type: 'connect',
                payload: {username},
            })

            setConnStatus('open');
            props.hasConnectedRef.current = true;
        });

        conn.on('disconnected', () => setConnStatus('reconnecting'))
        conn.on('close', () => setConnStatus('reconnecting'));

    }, [hostId, props.connRef, props.hasConnectedRef, props.hostIdRef, props.onDataRef, props.peerRef, props.usernameRef, username]);

    const isReconnecting = (connStatus === 'reconnecting' || connStatus === 'initial') && props.hostIdRef?.current && hostId && username && props.hasConnectedRef?.current;

    useEffect(() => {
        let timeout: any;
        if (isReconnecting) {
            timeout = setTimeout(() => {
                connect();
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [connStatus, connect, isReconnecting]);

    useEffect(() => {
        if (hostId && username && connStatus === 'initial') {
            connect();
        }
    }, [connStatus, connect, hostId, username]);

    return (
        <View className="bg-white flex-1">
            {connStatus !== 'open' && (
                <View className="flex justify-center items-center h-full">
                    <View className={classNames('flex-col p-4', isLandscape ? 'w-1/2' : 'w-full')}>
                        <View className="mb-4">
                            <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>
                        </View>

                        <View className="mb-4">
                            <Text className="text-lg">
                                <Text>Open a lobby at </Text>
                                <Text className="font-bold">cowch.laravel.cloud</Text>
                            </Text>
                        </View>

                        <Text className="font-bold text-lg">Lobby Code</Text>
                        <TextInput onChangeText={(value) => {
                            setHostId(value);
                            props.hostIdRef.current = value;
                        }}
                                   defaultValue={hostId}
                                   className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                        <Text className="font-bold text-lg">Username</Text>
                        <TextInput onChangeText={(value) => {
                            setUsername(value);
                            props.usernameRef.current = value;
                        }}
                                   defaultValue={username}
                                   className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                        <View className="mb-8">
                            <Button onPress={connect} disabled={!hostId || !username || isReconnecting}>
                                {isReconnecting ? 'Reconnecting...' : 'Connect'}
                            </Button>
                        </View>
                        {isReconnecting && (
                            <Text className="text-center text-orange-500 font-bold">
                                Connection lost. Trying to reconnect...
                            </Text>
                        )}
                    </View>
                </View>)}

            {connStatus === 'open' && (
                <View className="flex justify-center items-center h-full p-4">
                    <View className="w-full h-full shrink flex justify-center">
                        <View className="flex-row justify-between items-center mb-4">
                            <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>
                            <Text className="text-xl font-bold">Hello, {username}!</Text>
                        </View>
                        <View className="grid grid-cols-4 gap-2 mb-8 p-1 w-full">
                            {[
                                {
                                    id: 'holstein_friesian',
                                    img: require('@/assets/images/holstein-friesian-side.png'),
                                    name: 'Holstein Friesian',
                                },
                                {
                                    id: 'hereford',
                                    img: require('@/assets/images/hereford-side.png'),
                                    name: 'Hereford',
                                },
                                {
                                    id: 'angus',
                                    img: require('@/assets/images/angus-side.png'),
                                    name: 'Angus',
                                },
                                {
                                    id: 'highland',
                                    img: require('@/assets/images/highland-side.png'),
                                    name: 'Highland',
                                },
                            ].map(({id, img, name}) => (
                                <Pressable
                                    key={id}
                                    disabled={!availableBreeds.includes(id)}
                                    onPress={() => setBreed(id as CowBreed)}
                                    className={classNames(
                                        'flex flex-col gap-2 border-2 p-2',
                                        id === breed ? 'border-neutral-900' : 'border-transparent',
                                        !availableBreeds.includes(id) && 'opacity-20'
                                    )}>
                                    <Image source={img}
                                           className="aspect-[2/1] w-full shrink"/>
                                    <Text className="font-bold">{name}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View className="mb-8">
                            <Button onPress={join}>
                                Join
                            </Button>
                        </View>
                    </View>
                </View>
            )}
            <View className="absolute bottom-4 left-0 right-0 flex items-center">
                {!isLandscape && (
                    <Text className="text-neutral-400 text-sm italic">Best played in landscape 🔄</Text>
                )}

                <Text className="text-neutral-400 text-cs">www.hayleybech.me</Text>
            </View>
        </View>
    );
}
