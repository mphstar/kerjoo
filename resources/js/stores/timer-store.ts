import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
    activeItemId: number | null;
    startTime: number | null; // Timestamp in milliseconds
    accumulatedDuration: number; // In seconds
    isRunning: boolean;

    startTimer: (itemId: number, initialDuration?: number) => void;
    stopTimer: () => void;
    resetTimer: () => void;
    syncFromBackend: (itemId: number | null, isRunning: boolean, duration: number, startTime?: string) => void;
}

export const useTimerStore = create<TimerState>()(
    persist(
        (set) => ({
            activeItemId: null,
            startTime: null,
            accumulatedDuration: 0,
            isRunning: false,

            startTimer: (itemId, initialDuration = 0) => set({
                activeItemId: itemId,
                startTime: Date.now(),
                accumulatedDuration: initialDuration,
                isRunning: true,
            }),

            stopTimer: () => set((state) => {
                if (!state.startTime) return state;
                const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                return {
                    activeItemId: null, // Clear active item
                    startTime: null,
                    accumulatedDuration: state.accumulatedDuration + elapsed,
                    isRunning: false,
                };
            }),

            resetTimer: () => set({
                activeItemId: null,
                startTime: null,
                accumulatedDuration: 0,
                isRunning: false,
            }),

            syncFromBackend: (itemId, isRunning, duration, startTime) => set({
                activeItemId: itemId,
                isRunning: isRunning,
                accumulatedDuration: duration,
                startTime: isRunning && startTime ? new Date(startTime).getTime() : null,
            }),
        }),
        {
            name: 'logbook-timer-storage',
        }
    )
);
