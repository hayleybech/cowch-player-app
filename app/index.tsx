import {Pressable, Text, TextInput, useWindowDimensions, View} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import Peer, {makePeerHeartbeater} from "@/utils/peer-util";
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
            console.log('host connection opened');

            props.connRef.current = conn;
            conn.on('data', props.onDataRef.current);

            conn.send({
                type: 'connect',
                payload: {username},
            })

            setConnStatus('open');
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
            {connStatus !== 'open' && (
                <View className="flex">
                    <View className="flex justify-center items-center h-full">
                        <View className={classNames('flex-col p-4', isLandscape ? 'w-1/2' : 'w-full')}>
                            <View className="mb-4">
                                {/*<Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>*/}
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
                            {/*{!isLandscape && (*/}
                            {/*    <View className="flex items-center">*/}
                            {/*        <Text className="text-blue-600 text-base font-semibold">Best played in landscape 🔄</Text>*/}
                            {/*    </View>*/}
                            {/*)}*/}

                        </View>

                        <View className="left-0 right-0 flex items-center">
                            <Text className="text-neutral-200 text-lg text-shadow font-pixel-chip">www.hayleybech.me</Text>
                        </View>

                    </View>
                </View>
            )}

            {connStatus === 'open' && (
                <View className="flex justify-center items-center h-full pt-3 px-4">
                    <View className="w-full h-full shrink flex justify-center">
                        <View className="flex-row justify-between items-center mb-1">
                            {/*<Image source={require('@/assets/images/cowch-logo.png')} className="h-[25px] w-[100px]"/>*/}
                            <Text className="text-white text-4xl italic font-pixel-chip text-shadow">cowch</Text>
                            <Text className="text-xl text-white font-pixel-chip text-shadow">Hello, {username}!</Text>
                        </View>
                        <View className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1 p-1 w-full">
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
                                {
                                    id: 'belted_galloway',
                                    img: require('@/assets/images/belted-galloway-side.png'),
                                    name: 'Belted Galloway',
                                },
                                {
                                    id: 'british_white',
                                    img: require('@/assets/images/british-white-side.png'),
                                    name: 'British White',
                                },
                                {
                                    id: 'droughtmaster',
                                    img: require('@/assets/images/droughtmaster-side.png'),
                                    name: 'Droughtmaster',
                                },
                                {
                                    id: 'jersey',
                                    img: require('@/assets/images/jersey-side.png'),
                                    name: 'Jersey',
                                },
                            ].map(({id, img, name}) => (
                                <Pressable
                                    key={id}
                                    disabled={!availableBreeds.includes(id)}
                                    onPress={() => setBreed(id as CowBreed)}
                                    className={classNames(
                                        'flex flex-col gap-2 border-2 p-1',
                                        id === breed ? 'border-neutral-300 bg-neutral-700' : 'border-transparent',
                                        !availableBreeds.includes(id) && 'opacity-20'
                                    )}>
                                    <Image source={img}
                                           className="aspect-[2/1] w-full shrink"/>
                                    <View className="px-2">
                                        <Text className="text-white font-pixel-chip text-shadow text-lg">{name}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        <View className="mb-8">
                            <Button onPress={join}>
                                <Text className="font-pixel-chip text-shadow text-xl">
                                    Join
                                </Text>
                            </Button>
                        </View>

                        {/*{!isLandscape && (*/}
                        {/*    <View className="flex items-center">*/}
                        {/*        <Text className="text-blue-600 text-base font-semibold">Best played in landscape 🔄</Text>*/}
                        {/*    </View>*/}
                        {/*)}*/}
                    </View>
                </View>
            )}
        </View>
    );
}
