import {Pressable, Text, View} from 'react-native';
import "@/assets/css/global.css"
import {Image} from 'expo-image';
import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import classNames from "classnames";
import {CowBreed} from "@/app/cooow";
import {usePeer} from "@/hooks/use-peer";

export default function BreedSelectionScreen() {
    const { props, sendData, setOnDataReceived } = usePeer();
    const [breed, setBreed] = useState<CowBreed>('highland');
    const [availableBreeds, setAvailableBreeds] = useState<string[]>([
        'holstein_friesian', 'hereford', 'angus', 'highland', 'belted_galloway', 'british_white', 'droughtmaster', 'jersey',
    ]);

    const router = useRouter();

    useEffect(() => {
        setOnDataReceived((data: any) => {
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
        });
    }, [setOnDataReceived, router]);

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
            <View className="flex justify-center items-center h-full pt-3 px-4">
                <View className="w-full h-full shrink flex justify-center">
                    <View className="flex-row justify-between items-center mb-1">
                        <Pressable onPress={() => router.replace('/')}>
                            <Text className="text-white text-4xl italic font-pixel-chip text-shadow">cowch</Text>
                        </Pressable>
                        <Text className="text-xl text-white font-pixel-chip text-shadow">Hello, {props.usernameRef.current}!</Text>
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
                </View>
            </View>
        </View>
    );
}
