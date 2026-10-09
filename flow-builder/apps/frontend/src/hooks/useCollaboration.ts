import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../api/origin';

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

export interface CollabCursor {
  x: number;
  y: number;
  user: CollabUser;
}

interface UseCollaborationProps {
  roomId: string;
  namespace: 'flow' | 'whiteboard' | 'docs';
  user: CollabUser;
  onUserJoin?: (user: CollabUser) => void;
  onUserLeave?: (user: CollabUser) => void;
  onCursor?: (cursor: CollabCursor) => void;
  onSelection?: (selection: any) => void;
  onChange?: (payload: any) => void;
}

export const useCollaboration = ({
  roomId,
  namespace,
  user,
  onUserJoin,
  onUserLeave,
  onCursor,
  onSelection,
  onChange,
}: UseCollaborationProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(`${API_ORIGIN}/${namespace}`, {
      auth: { token: 'demo-token' }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('user_join', { roomId, user });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('presence', (users: CollabUser[]) => {
      setConnectedUsers(users);
    });

    newSocket.on('user_join', (joinedUser: CollabUser) => {
      setConnectedUsers(prev => [...prev, joinedUser]);
      onUserJoin?.(joinedUser);
    });

    newSocket.on('user_leave', (leftUser: CollabUser) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== leftUser.id));
      onUserLeave?.(leftUser);
    });

    newSocket.on('cursor', ({ socketId, cursor }: { socketId: string; cursor: any }) => {
      onCursor?.({ ...cursor, socketId });
    });

    newSocket.on('selection', ({ socketId, selection }: { socketId: string; selection: any }) => {
      onSelection?.({ socketId, selection });
    });

    newSocket.on('change', (payload: any) => {
      onChange?.(payload);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, namespace, user.id]);

  const sendCursor = useCallback((cursor: { x: number; y: number }) => {
    if (socket && isConnected) {
      socket.emit('cursor', { roomId, cursor });
    }
  }, [socket, isConnected, roomId]);

  const sendSelection = useCallback((selection: any) => {
    if (socket && isConnected) {
      socket.emit('selection', { roomId, selection });
    }
  }, [socket, isConnected, roomId]);

  const sendChange = useCallback((payload: any) => {
    if (socket && isConnected) {
      socket.emit('change', { roomId, payload });
    }
  }, [socket, isConnected, roomId]);

  return {
    socket,
    isConnected,
    connectedUsers,
    sendCursor,
    sendSelection,
    sendChange,
  };
};