import React from 'react';

const Home = ({ username, onLogout }) => {
  return (
    <div style={styles.container}>
      <div style={styles.home}>
        <h2>Welcome Back，{username}!</h2>
        <button style={styles.button} onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },
  home: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};

export default Home;
