import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        // No user = no token = nothing to connect with yet
        if (!user) {
            return;
        }

        const token = localStorage.getItem('token');
        const newSocket = io('http://localhost:4444', {
            auth: { token },
        });

        setSocket(newSocket);

        // Cleanup: disconnect when the user logs out or this provider unmounts
        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}