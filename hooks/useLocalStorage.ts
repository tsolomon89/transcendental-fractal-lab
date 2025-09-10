
import { useState, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: React.SetStateAction<T>) => {
        setStoredValue(prevValue => {
            try {
                const valueToStore = value instanceof Function ? value(prevValue) : value;
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                return valueToStore;
            } catch (error) {
                console.error(error);
                return prevValue; // On error, don't change the state
            }
        });
    }, [key]);

    return [storedValue, setValue];
}

export default useLocalStorage;
