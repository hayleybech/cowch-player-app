import { useContext, useEffect, useCallback } from 'react';
import Peer, { makePeerHeartbeater } from "@/utils/peer-util";
import { ScreenPropsContext } from "@/app/_layout";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePeer() {
    const props = useContext(ScreenPropsContext);

    // Initialize Peer and Heartbeat
    useEffect(() => {
        if (!props.peerRef || props.peerRef.current) return;

        console.log('Initializing Peer...');
        const peer = new Peer();
        props.peerRef.current = peer;

        peer.on('open', (id: string) => {
            console.log('broker ready', id);
            props.heartbeatRef.current = makePeerHeartbeater(peer);
        });
        
        peer.on('disconnected', (id: string) => console.log('broker disconnected: ', id));
        peer.on('closed', () => console.log('broker closed'));
        peer.on('error', (error: any) => console.error('broker error', error));

        return () => {
            // Note: We might NOT want to destroy peer on every unmount if we want it to persist.
            // But since this hook is used in screens, and we want it to survive navigation, 
            // we rely on props.peerRef.current check at the top.
            // If the whole app unmounts, this might run.
        };
    }, [props.peerRef, props.heartbeatRef]);

    const sendData = useCallback((data: any) => {
        if (props.connRef.current?.open) {
            const dataToSend = {
                ...data,
                uuid: props.playerUuid
            };
            props.connRef.current.send(dataToSend);
        } else {
            console.warn('sendData called but connection is not open');
        }
    }, [props.connRef, props.playerUuid]);

    const connectToHost = useCallback((hostId: string, username: string, onOpen?: () => void) => {
        if (!props.peerRef.current) {
            console.warn('connectToHost called but peer is not initialized');
            return;
        }

        props.setHostId(hostId);
        props.setUsername(username);

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);
        
        conn.on('open', () => {
            console.log('host connection opened');
            props.connRef.current = conn;
            conn.on('data', (data: any) => {
                if (data?.type === 'connected' && data?.payload?.uuid) {
                    const newUuid = data.payload.uuid;
                    props.setPlayerUuid(newUuid);
                    AsyncStorage.setItem('playerUuid', newUuid).catch(e => console.error('Failed to save playerUuid', e));
                }

                if (props.onDataCallbackRef.current) {
                    props.onDataCallbackRef.current(data);
                }
            });
            
            conn.send({
                type: 'connect',
                payload: { 
                    username,
                    uuid: props.playerUuid
                },
            });
            
            props.hasConnectedRef.current = true;
            onOpen?.();
        });

        conn.on('error', (error: any) => console.log('host connection error', error));
        conn.on('disconnected', () => console.log('host disconnected'));
        conn.on('close', () => console.log('host closed'));
        
        return conn;
    }, [props]);

    const setOnDataReceived = useCallback((cb: (data: any) => void) => {
        props.onDataCallbackRef.current = cb;
    }, [props.onDataCallbackRef]);

    return {
        peer: props.peerRef.current,
        connection: props.connRef.current,
        connectToHost,
        sendData,
        setOnDataReceived,
        // Expose refs if needed for specific cases
        props 
    };
}
