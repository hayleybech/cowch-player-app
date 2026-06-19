export type CowBreed = 'holstein_friesian' | 'angus' | 'hereford' | 'highland' | 'belted_galloway' | 'british_white' | 'droughtmaster' | 'jersey';

export interface GameState {
    isPaused: boolean;
    hasStarted: boolean;
    hasPowerup: boolean;
    isDead: boolean;
    isGameEnded: boolean;
    isConnecting: boolean;
    winner: string | undefined;
    selectedBreed: CowBreed | null;
}

export const initialGameState: GameState = {
    isPaused: true,
    hasStarted: false,
    hasPowerup: false,
    isDead: false,
    isGameEnded: false,
    isConnecting: false,
    winner: undefined,
    selectedBreed: null,
};

export type GameAction =
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'START_GAME' }
    | { type: 'POWERUP_STORED' }
    | { type: 'POWERUP_USED' }
    | { type: 'DIED' }
    | { type: 'SET_CONNECTING', payload: boolean }
    | { type: 'SET_BREED', payload: CowBreed | null }
    | { type: 'SYNC_STATE', payload: any }
    | { type: 'PEER_OPEN' }
    | { type: 'GAME_OVER', payload: { winner: string } };

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'PEER_OPEN':
            return {...state};
        case 'PAUSE':
            return {...state, isPaused: true};
        case 'RESUME':
            return {...state, isPaused: false};
        case 'START_GAME':
            return {
                ...state,
                hasStarted: true,
                isPaused: false,
                isGameEnded: false,
                isDead: false,
                winner: undefined,
            };
        case 'POWERUP_STORED':
            return {...state, hasPowerup: true};
        case 'POWERUP_USED':
            return {...state, hasPowerup: false};
        case 'DIED':
            return {...state, isDead: true};
        case 'SET_CONNECTING':
            return {...state, isConnecting: action.payload};
        case 'SET_BREED':
            return {...state, selectedBreed: action.payload};
        case 'GAME_OVER':
            return {
                ...state,
                isGameEnded: true,
                winner: action.payload.winner,
            };
        case 'SYNC_STATE':
            return {
                ...state,
                isPaused: action.payload.isPaused,
                hasStarted: action.payload.hasStarted,
                hasPowerup: action.payload.hasPowerup,
                isDead: !action.payload.isAlive,
                isGameEnded: action.payload.hasEnded,
                isConnecting: false,
                winner: action.payload.isWinner ? 'You' : undefined, // simplified
                selectedBreed: action.payload.selectedBreed || state.selectedBreed,
            };
        default:
            return state;
    }
}
