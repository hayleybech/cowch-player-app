import {Pressable, ScrollView, Text, TextInput, useWindowDimensions, View} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import Peer from "peerjs";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import {ScreenPropsContext} from "@/app/_layout";
import classNames from "classnames";
import {CowBreed} from "@/app/cooow";

type ConnectionStatus = 'initial' | 'open' | 'closed';

export default function LobbyScreen() {
    const [hostId, setHostId] = useState<string>();
    const [username, setUsername] = useState<string>();
    const [breed, setBreed] = useState<CowBreed>('highland');
    const [availableBreeds, setAvailableBreeds] = useState<string[]>(['holstein-friesian', 'hereford', 'angus', 'highland']);

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

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);

        conn.on('open', function () {
            props.connRef.current = conn;
            conn.on('data', props.onDataRef.current);

            conn.send({
                type: 'connect',
                payload: {username},
            })

            setConnStatus('open');
        });

        conn.on('close', () => {
            setConnStatus('closed');
            router.navigate('/');
        })


    }, [hostId, props.connRef, props.onDataRef, props.peerRef, router, username]);


    return (
        <View className="bg-white flex-1">
            {connStatus !== 'open' && (
            <View className="flex justify-center items-center h-full">
                <View className="flex-col w-1/2">
                    <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>

                    <Text className="font-bold text-lg">Lobby Code</Text>
                    <TextInput onChangeText={(value) => setHostId(value)}
                               className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                    <Text className="font-bold text-lg">Username</Text>
                    <TextInput onChangeText={(value) => setUsername(value)}
                               className="mb-4 text-lg border border-neutral-400 rounded focus:border-neutral-800 focus:rounded"/>

                    <View className="mb-8">
                        <Button onPress={connect} disabled={!hostId || !username}>
                            Connect
                        </Button>
                    </View>
                </View>
            </View>)}

            {connStatus === 'open' && (
            <View className="flex justify-center items-center h-full p-4">
                <View className="w-full h-full shrink flex justify-center">
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

        </View>
    )
        ;
}
