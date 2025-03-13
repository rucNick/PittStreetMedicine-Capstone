import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Volunteer = ({ onLogout, userData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Destructure dynamic user info
  const { userId, username, role } = userData;

  // Fetch orders from the backend using query parameters.
  const fetchOrders = async (status) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8080/api/orders/all', {
        params: {
          authenticated: true,
          userId: userId,
          userRole: role,
        },
      });
      let fetchedOrders = response.data.orders || [];
      // Filter orders based on the required status
      fetchedOrders = fetchedOrders.filter((order) => order.status === status);
      // Directly set the filtered orders to state
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  // Click button to view "PENDING" orders
  const handleViewPending = () => {
    fetchOrders('PENDING');
  };

  // Click button to view "CANCELLED" orders
  const handleViewCancelled = () => {
    fetchOrders('CANCELLED');
  };

  // Click button to view "PROCESSING" orders
  const handleViewProcessing = () => {
    fetchOrders('PROCESSING');
  };

  // Update order status from "PENDING" to "PROCESSING"
  const handleSetProcessing = async (orderId) => {
    try {
      setLoading(true);
      // Call backend PUT API to update order status
      await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, {
        authenticated: true,
        userId: userId,
        userRole: role,
        status: 'PROCESSING',
      });
      // After successful update, re-fetch the current order list (e.g. PENDING)
      fetchOrders('PENDING');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div style={styles.content}>
        <h1>Volunteer Dashboard</h1>
        <p>Welcome back, {username}!</p>
        <div style={styles.leftPanel}>
          {/* Centered button group with four buttons */}
          <div style={styles.buttonGroup}>
            <button style={styles.actionButton} onClick={handleViewPending}>
              View Pending Orders
            </button>
            <button style={styles.actionButton} onClick={handleViewCancelled}>
              View Orders Already Cancelled
            </button>
            <button style={styles.actionButton} onClick={handleViewProcessing}>
              View Processing Orders
            </button>
            {/* New button to go to Cargo_Volunteer.js */}
            <button
              style={styles.actionButton}
              onClick={() => navigate('/cargo_volunteer')}
            >
              Cargo Volunteer
            </button>
          </div>
          {loading && <p>Loading orders...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {orders.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Order ID</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Item Name</th>
                  <th style={styles.tableHeaderCell}>Quantity</th>
                  <th style={styles.tableHeaderCell}>Order Time</th>
                  <th style={styles.tableHeaderCell}>User ID</th>
                  <th style={styles.tableHeaderCell}>Delivery Address</th>
                  <th style={styles.tableHeaderCell}>Phone Number</th>
                  <th style={styles.tableHeaderCell}>Note</th>
                  <th style={styles.tableHeaderCell}>Order Type</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) =>
                  order.orderItems.map((item, idx) => (
                    <tr key={`${order.orderId}-${idx}`}>
                      <td style={styles.tableCell}>{order.orderId}</td>
                      <td style={styles.tableCell}>
                        {order.status}
                        {order.status === 'PENDING' && (
                          <button
                            style={{ marginLeft: '10px' }}
                            onClick={() => handleSetProcessing(order.orderId)}
                          >
                            Processing
                          </button>
                        )}
                      </td>
                      <td style={styles.tableCell}>{item.itemName}</td>
                      <td style={styles.tableCell}>{item.quantity}</td>
                      <td style={styles.tableCell}>
                        {new Date(order.requestTime).toLocaleString()}
                      </td>
                      <td style={styles.tableCell}>{order.userId}</td>
                      <td style={styles.tableCell}>{order.deliveryAddress}</td>
                      <td style={styles.tableCell}>{order.phoneNumber}</td>
                      <td style={styles.tableCell}>{order.notes}</td>
                      <td style={styles.tableCell}>{order.orderType}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  topBar: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    marginTop: '60px',
    textAlign: 'center',
  },
  leftPanel: {
    textAlign: 'left',
    margin: '20px auto',
    width: '90%',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  // Updated to center the buttons
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  actionButton: {
    padding: '10px 15px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeaderCell: {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: '#f7f7f7',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  tableCell: {
    border: '1px solid #ccc',
    padding: '8px',
    textAlign: 'left',
  },
};

export default Volunteer;
