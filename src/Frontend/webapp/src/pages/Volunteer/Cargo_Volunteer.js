// File: Cargo_Volunteer.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cargo_Volunteer = () => {
  const baseURL = process.env.REACT_APP_BASE_URL;

  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]);
  const [error, setError] = useState('');

  // Fetch cargo items from backend
  const fetchAllItems = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/api/cargo/items`);
      setAllItems(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }, [baseURL]);

  // Fetch all items on component mount
  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  // Navigate back to volunteer page
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={handleBack}>
          Back to Volunteer Page
        </button>
      </div>

      <h1>Welcome to the Cargo Volunteer Page!</h1>

      <div style={styles.section}>
        <h2>Inventory Management (Read-Only)</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeaderCell}>ID</th>
              <th style={styles.tableHeaderCell}>Name</th>
              <th style={styles.tableHeaderCell}>Description</th>
              <th style={styles.tableHeaderCell}>Category</th>
              <th style={styles.tableHeaderCell}>Total-Quantity</th>
              <th style={styles.tableHeaderCell}>Size</th>
              <th style={styles.tableHeaderCell}>Size-Quantity</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => {
              const hasSizes =
                item.sizeQuantities && Object.keys(item.sizeQuantities).length > 0;

              return (
                <React.Fragment key={item.id}>
                  {/* Main row (item info) */}
                  <tr>
                    <td style={styles.tableCell}>{item.id}</td>
                    <td style={styles.tableCell}>{item.name}</td>
                    <td style={styles.tableCell}>{item.description}</td>
                    <td style={styles.tableCell}>{item.category}</td>
                    {/* Check if item.quantity < 5 */}
                    <td style={styles.tableCell}>
                      {item.quantity}
                      {item.quantity < 5 && (
                        <span style={{ color: 'red', marginLeft: '5px' }}>
                          (Low-Stock!)
                        </span>
                      )}
                    </td>
                    {/* If no multiple sizes, show empty cells for size columns */}
                    <td style={styles.tableCell}></td>
                    <td style={styles.tableCell}></td>
                  </tr>

                  {/* If there is size information, display additional rows for each size */}
                  {hasSizes &&
                    Object.entries(item.sizeQuantities).map(([size, qty]) => (
                      <tr key={`${item.id}-${size}`}>
                        {/* Blank cells for the first 5 columns */}
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}></td>
                        {/* Show the size and size quantity in the last two columns */}
                        <td style={styles.tableCell}>{size}</td>
                        <td style={styles.tableCell}>
                          {qty}
                          {qty < 5 && (
                            <span style={{ color: 'red', marginLeft: '5px' }}>
                              (Low-Stock!)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================= STYLES =========================
const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  // We removed maxWidth and used width: '90%' for a wider display
  section: {
    margin: '20px auto',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    textAlign: 'left',
  },
  table: {
    margin: '0 auto',
    borderCollapse: 'collapse',
    width: '100%',
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

export default Cargo_Volunteer;
