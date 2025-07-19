// App.jsx
import React, { useState, useEffect } from 'react';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import axios from 'axios';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('chatapp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5005/api/users');
        setUsers(res.data);
      } catch (err) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const handleRegister = async (form) => {
    try {
      await axios.post('http://localhost:5005/api/users/register', form);
      setShowRegister(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleLogin = async (form) => {
    try {
      const response = await axios.post('http://localhost:5005/api/users/login', form);
      setUser(response.data.user);
      localStorage.setItem('chatapp_user', JSON.stringify(response.data.user));
    } catch (err) {
      alert(err.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedChat(null);
    localStorage.removeItem('chatapp_user');
  };

  if (!user) {
    return (
      <>
        {showRegister ? (
          <RegisterForm onRegister={handleRegister} onNavigateToLogin={() => setShowRegister(false)} />
        ) : (
          <>
            <LoginForm onLogin={handleLogin} onNavigateToRegister={() => setShowRegister(true)} />
          </>
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ChatList user={user} users={users} onSelectChat={setSelectedChat} onLogout={handleLogout} />
      <div style={{ flex: 1 }}>
        {selectedChat ? (
          <ChatWindow user={user} chat={selectedChat} users={users} />
        ) : (
          <div style={{ padding: 32, color: '#888' }}>Bir sohbet seçin…</div>
        )}
      </div>
    </div>
  );
}

export default App;