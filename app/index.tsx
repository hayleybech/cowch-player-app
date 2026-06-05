import {Text, TextInput, useWindowDimensions, View} from 'react-native';
import "@/assets/css/global.css"

import {useCallback, useEffect} from "react";
import {Button} from "@/components/ui/Button";
import {useRouter} from "expo-router";
import classNames from "classnames";
import {usePeer} from "@/hooks/use-peer";

export default function LobbyScreen() {
    const { props, connectToHost, setOnDataReceived } = usePeer();

    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const router = useRouter();

    useEffect(() => {
        setOnDataReceived((data: any) => {
            if (data?.type === 'player_joined') {
                router.navigate('/breed-selection');
            }
        });
    }, [setOnDataReceived, router]);

    const connect = useCallback(() => {
        if (!props.hostId || !props.username) {
            return;
        }

        connectToHost(props.hostId, props.username);
    }, [props.hostId, props.username, connectToHost]);

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
                            onChangeText={(value) => props.setHostId(value.toUpperCase())}
                            value={props.hostId}
                            autoCapitalize="characters"
                            maxLength={4}
                            className="mb-4 text-xl text-white text-shadow font-pixel-chip border border-neutral-400 py-0.5 px-2 focus:border-white [outline:none!important]"
                        />

                        <Text className="text-xl text-shadow font-pixel-chip text-white">Username</Text>
                        <TextInput
                            onChangeText={(value) => props.setUsername(value)}
                            maxLength={8}
                            value={props.username}
                            className="mb-4 text-xl text-shadow font-pixel-chip border border-neutral-400 text-white py-0.5 px-2 focus:border-white [outline:none!important]"
                        />

                        <View className="mb-3">
                            <Button onPress={connect} disabled={!props.hostId || !props.username}>
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
