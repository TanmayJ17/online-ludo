import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import WaitingRoom from './pages/WaitingRoom';
import { SocketProvider } from './context/SocketContext';
import AdminRoute from './components/AdminRoute';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// test area
// import Board from './components/Board';
// import Token from './components/Token';
import GameBoard from './pages/GameBoard';
// test area end

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>


          {/* test area */}
          {/* <Route
            path="/"
            element={
              <div className="min-h-screen bg-cream flex items-center justify-center">
                <Board>
                    {['red', 'green', 'yellow', 'blue'].map((color) =>
                        [0, 1, 2, 3].map((i) => (
                            <Token
                                key={`${color}-${i}`}
                                color={color}
                                boardPosition={-1}
                                tokenIndex={i}
                                isMovable={color === 'red' && i === 0}
                            />
                        ))
                    )}
                </Board>
              </div>
            }
          /> */}
          <Route
            path="/game/:roomCode"
            element={
              <ProtectedRoute>
                <GameBoard />
              </ProtectedRoute>
            }
          />
          {/* test area end */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/waiting/:roomCode"
            element={
              <ProtectedRoute>
                <WaitingRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* <h1 className="text-center mt-20 text-2xl">Lobby coming soon</h1> */}
                <Lobby />
              </ProtectedRoute>
            }
          />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App