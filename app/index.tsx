import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
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
                payload: {username, breed},
            });

            setConnStatus('open');

            router.navigate('/cooow');

            conn.on('data', props.onDataRef.current);
        });

        conn.on('close', () => {
            setConnStatus('closed');
            router.navigate('/');
        })


    }, [breed, hostId, props.connRef, props.onDataRef, props.peerRef, router, username]);


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

                    <View className="grid grid-cols-2 gap-2 mb-8 p-1 w-full">
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
                                onPress={() => setBreed(id as CowBreed)}
                                className={classNames(
                                    'flex flex-col gap-2 border-2 p-2',
                                    id === breed ? 'border-neutral-900' : 'border-transparent',
                                )}>
                                <Image source={img}
                                       className="aspect-[2/1] w-full shrink"/>
                                <Text className="font-bold">{name}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <View className="mb-8">
                        <Button onPress={connect} disabled={(!hostId || !username) || connStatus === 'open'}>
                            Connect
                        </Button>
                    </View>
                </View>

            </View>

        </ScrollView>
    )
        ;
}
