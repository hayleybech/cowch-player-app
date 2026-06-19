import { useContext, useEffect, useCallback, useRef } from 'react';
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
            // Trigger a re-render so that peerRef.current?.open can be detected
            props.dispatch({ type: 'PEER_OPEN' });
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
    }, [props.peerRef, props.heartbeatRef, props.dispatch]);

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

        if (props.connRef.current && props.connRef.current.open) {
            console.log('Already connecting or connected, skipping connectToHost');
            return;
        }

        props.setHostId(hostId);
        props.setUsername(username);
        props.dispatch({ type: 'SET_CONNECTING', payload: true });

        const conn = props.peerRef.current.connect(`COWCH-${hostId}`);

        const setupConn = (c: any) => {
            props.connRef.current = c;

            // Important: immediately attach listeners for reconnection if this connection was just established
            c.on('close', () => {
                if (!props.hasConnectedRef.current) return;
                props.dispatch({ type: 'SET_CONNECTING', payload: true });
            });
            c.on('disconnected', () => {
                if (!props.hasConnectedRef.current) return;
                props.dispatch({ type: 'SET_CONNECTING', payload: true });
            });

            c.on('data', (data: any) => {
                console.log('data:', data);

                if (data?.type === 'connected' && data?.payload) {
                    const {
                        uuid,
                        availableBreeds,
                        selectedBreed,
                        hasStarted,
                        isPaused,
                        hasPowerup,
                        isAlive,
                        hasEnded,
                        isWinner
                    } = data.payload;

                    if (uuid) {
                        props.setPlayerUuid(uuid);
                        AsyncStorage.setItem('playerUuid', uuid).catch(e => console.error('Failed to save playerUuid', e));
                    }

                    // Save hostId and username only after successful connection
                    AsyncStorage.setItem('hostId', hostId).catch(e => console.error('Failed to save hostId', e));
                    AsyncStorage.setItem('username', username).catch(e => console.error('Failed to save username', e));

                    if (availableBreeds) {
                        props.setAvailableBreeds(availableBreeds);
                    }

                    props.dispatch({
                        type: 'SYNC_STATE',
                        payload: {
                            hasStarted,
                            isPaused,
                            hasPowerup,
                            isAlive,
                            hasEnded,
                            isWinner,
                            selectedBreed: selectedBreed ? selectedBreed : null,
                        }
                    });
                }

                if (props.onDataCallbackRef.current) {
                    props.onDataCallbackRef.current(data);
                }
            });

            c.send({
                type: 'connect',
                payload: {
                    username,
                    uuid: props.playerUuid
                },
            });

            props.hasConnectedRef.current = true;
            onOpen?.();
        };

        if (conn.open) {
            setupConn(conn);
        } else {
            conn.on('open', () => {
                console.log('host connection opened');
                setupConn(conn);
            });
        }

        conn.on('error', (error: any) => {
            console.log('host connection error', error);
            props.dispatch({ type: 'SET_CONNECTING', payload: false });
        });
        conn.on('disconnected', () => {
            console.log('host disconnected');
            props.dispatch({ type: 'SET_CONNECTING', payload: false });
        });
        conn.on('close', () => {
            console.log('host closed');
            props.dispatch({ type: 'SET_CONNECTING', payload: false });
        });

        return conn;
    }, [props]);

    const setOnDataReceived = useCallback((cb: (data: any) => void) => {
        props.onDataCallbackRef.current = cb;

        // If we already have an open connection, ensure it's using the latest callback logic
        // (Though the listener in connectToHost already uses the ref, so this is just for safety/clarity)
        if (props.connRef.current && !props.connRef.current.listeners('data').length) {
             props.connRef.current.on('data', (data: any) => {
                 if (props.onDataCallbackRef.current) {
                     props.onDataCallbackRef.current(data);
                 }
             });
        }
    }, [props]);

    const clearSession = useCallback(async () => {
        if (props.connRef.current) {
            props.connRef.current.close();
            props.connRef.current = null;
        }
        props.hasConnectedRef.current = false;
        props.setHostId('');
        props.setUsername('');
        props.setPlayerUuid(null);
        props.dispatch({ type: 'RESET_STATE' });

        try {
            await Promise.all([
                AsyncStorage.removeItem('hostId'),
                AsyncStorage.removeItem('username'),
                AsyncStorage.removeItem('playerUuid'),
            ]);
        } catch (e) {
            console.error('Failed to clear session from storage', e);
        }
    }, [props]);

    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        // Auto-connect on initial load
        if (isInitialLoadRef.current && props.hostId && props.username && props.playerUuid && props.peerRef.current?.open && !props.hasConnectedRef.current && !props.connRef.current) {
            console.log('Auto-connecting to host on initial load...');
            connectToHost(props.hostId, props.username);
            isInitialLoadRef.current = false;
        }
    }, [props.hostId, props.username, props.playerUuid, props.peerRef.current?.open, props.connRef, connectToHost, props.hasConnectedRef]);

    useEffect(() => {
        const handleReconnection = () => {
            if (!props.hasConnectedRef.current) return;
            props.dispatch({ type: 'SET_CONNECTING', payload: true });
        };

        const currentConn = props.connRef.current;
        if (currentConn) {
            currentConn.on('close', handleReconnection);
            currentConn.on('disconnected', handleReconnection);
        }

        return () => {
            if (currentConn) {
                currentConn.off('close', handleReconnection);
                currentConn.off('disconnected', handleReconnection);
            }
        }
    }, [props.connRef.current, props.dispatch]);

    useEffect(() => {
        let timeout: any;
        if (props.gameState.isConnecting && props.hasConnectedRef.current) {
            timeout = setTimeout(() => {
                if (props.hostId && props.username) {
                    connectToHost(props.hostId, props.username);
                }
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [props.gameState.isConnecting, connectToHost, props.hostId, props.username, props.hasConnectedRef]);

    return {
        peer: props.peerRef.current,
        connection: props.connRef.current,
        connectToHost,
        sendData,
        setOnDataReceived,
        clearSession,
        // Expose refs if needed for specific cases
        props
    };
}
