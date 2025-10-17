import {ScrollView, View} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import {ScreenPropsContext} from "@/app/_layout";

export type CowBreed = 'holstein-friesian' | 'angus' | 'hereford' | 'highland';
type Direction = 'up' | 'down' | 'right' | 'left';
type ConnectionStatus = 'initial' | 'open' | 'closed';
type GameNotification = { type: 'paused' } | { type: 'resumed' } | { type: 'changed_direction', payload: Direction };

export default function CooowScreen() {
    const props = useContext(ScreenPropsContext);

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const [currentDirection, setCurrentDirection] = useState<Direction | undefined>(undefined);

    useEffect(() => {
        if (!props.connRef.current) {
            return;
        }

        props.onDataCallbackRef.current = (data: unknown) => {
            const action = data as GameNotification;

            if (action.type === 'paused') {
                setIsPaused(true);
            }
            if (action.type === 'resumed') {
                setIsPaused(false);
            }
            if (action.type === 'changed_direction') {
                setCurrentDirection(action.payload);
            }
        };

        props.connRef.current.on('close', () => setConnStatus('closed'))


    }, []);

    const requestPause = useCallback(() => {
        if (!props.connRef.current) {
            return;
        }

        props.connRef.current.send({
            type: 'pause',
        })
    }, [])

    const move = useCallback((direction: Direction) => {
        if (!props.connRef.current) {
            return;
        }
        props.connRef.current.send({
            type: 'move',
            payload: direction,
        });
    }, []);

    return (
        <ScrollView className="bg-white">
            <View className="px-4 py-8 flex gap-8">
                <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>

                <View>
                    <View className="mb-16">
                        <Button onPress={requestPause} disabled={!props.connRef.current}>
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                    </View>

                    <View className="flex gap-2 mb-16">
                        <Button onPress={() => move('up')}
                                disabled={!props.connRef.current || isPaused || currentDirection === 'up' || currentDirection === 'down'}
                                className="h-32">
                            Up
                        </Button>
                        <View className="flex gap-2 flex-row flex-nowrap justify-between">
                            <View className="grow">

                                <Button onPress={() => move('left')}
                                        disabled={!props.connRef.current || isPaused || currentDirection === 'left' || currentDirection === 'right'}
                                        className="h-32">
                                    Left
                                </Button>
                            </View>
                            <View className="grow">
                                <Button onPress={() => move('right')}
                                        disabled={!props.connRef.current || isPaused || currentDirection === 'left' || currentDirection === 'right'}
                                        className="h-32">
                                    Right
                                </Button>
                            </View>
                        </View>
                        <Button onPress={() => move('down')}
                                disabled={!props.connRef.current || isPaused || currentDirection === 'up' || currentDirection === 'down'}
                                className="h-32">
                            Down
                        </Button>
                    </View>
                </View>

            </View>

        </ScrollView>
    );
}
