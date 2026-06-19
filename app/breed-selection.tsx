import {Pressable, Text, View} from 'react-native';
import "@/assets/css/global.css"
import {Image} from 'expo-image';
import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import classNames from "classnames";
import {usePeer} from "@/hooks/use-peer";
import {BREED_DATA} from "@/constants/breeds";
import {CowBreed} from "@/constants/game-state";
import {ConnectingOverlay, ReconnectingOverlay} from "@/components/Overlays";

export default function BreedSelectionScreen() {
    const { props, sendData, setOnDataReceived } = usePeer();
    const { gameState, dispatch } = props;
    const availableBreeds = props.availableBreeds || [];

    const breed = gameState.selectedBreed;
    const setBreed = useCallback((newBreed: CowBreed | ((curr: CowBreed | null) => CowBreed | null)) => {
        if (typeof newBreed === 'function') {
            dispatch({ type: 'SET_BREED', payload: newBreed(breed) });
        } else {
            dispatch({ type: 'SET_BREED', payload: newBreed });
        }
    }, [breed, dispatch]);

    const router = useRouter();

    useEffect(() => {
        setOnDataReceived((data: any) => {
            if (data?.type === 'connected') {
                if (data.payload?.selectedBreed) {
                    router.navigate('/cooow');
                }
            }
            if (data?.type === 'player_joined') {
                const newAvailableBreeds = data.payload as string[];
                props.setAvailableBreeds(newAvailableBreeds);
            }
            if (data?.type === 'joined') {
                if (data.payload?.breed) {
                    dispatch({ type: 'SET_BREED', payload: data.payload.breed });
                }
                router.navigate('/cooow');
            }
        });
    }, [setOnDataReceived, router, props, dispatch]);

    const join = useCallback(() => {
        if (!breed) {
            return;
        }

        sendData({
            type: 'join',
            payload: {breed},
        });
    }, [breed, sendData]);

    return (
        <View className="bg-neutral-800 flex-1">
            {gameState.isConnecting && (props.hasConnectedRef.current ? <ReconnectingOverlay/> : <ConnectingOverlay/>)}
            <View className="flex justify-center items-center h-full pt-3 px-4">
                <View className="w-full h-full shrink flex justify-center">
                    <View className="flex-row justify-between items-center mb-1">
                        <Pressable onPress={() => router.replace('/')}>
                            <Text className="text-white text-4xl italic font-pixel-chip text-shadow">cowch</Text>
                        </Pressable>
                        <Text className="text-xl text-white font-pixel-chip text-shadow">Hello, {props.username}!</Text>
                    </View>
                    <View className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1 p-1 w-full">
                        {BREED_DATA.map(({id, img, name}) => (
                            <Pressable
                                key={id}
                                disabled={!availableBreeds.includes(id)}
                                onPress={() => setBreed(id as CowBreed)}
                                className={classNames(
                                    'flex flex-col gap-2 border-2 p-1',
                                    id === breed ? 'border-neutral-300 bg-neutral-700' : 'border-transparent',
                                    !availableBreeds.includes(id) && 'opacity-20'
                                )}>
                                <Image source={img} className="aspect-[2/1] w-full shrink" />
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
                </View>
            </View>
        </View>
    );
}
