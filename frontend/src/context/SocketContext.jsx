import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { updateTaskLocally, addTaskFromSocket, removeTaskFromSocket } from '../store/slices/taskSlice';
import { updateProjectLocally } from '../store/slices/projectSlice';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io('http://localhost:5005', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    // Real-time task events
    socket.on('task:create', (task) => dispatch(addTaskFromSocket(task)));
    socket.on('task:update', (task) => dispatch(updateTaskLocally(task)));
    socket.on('task:delete', ({ taskId }) => dispatch(removeTaskFromSocket(taskId)));
    socket.on('kanban:reorder', ({ items }) => {
      items.forEach((item) => dispatch(updateTaskLocally({ _id: item.id, status: item.status, position: item.position })));
    });

    // Project updates
    socket.on('project:update', (project) => dispatch(updateProjectLocally(project)));

    // Notifications
    socket.on('notification:new', (notification) => dispatch(addNotification(notification)));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, dispatch]);

  const joinProject = (projectId) => socketRef.current?.emit('project:join', projectId);
  const leaveProject = (projectId) => socketRef.current?.emit('project:leave', projectId);
  const emitTyping = (data) => socketRef.current?.emit('comment:typing', data);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinProject, leaveProject, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
