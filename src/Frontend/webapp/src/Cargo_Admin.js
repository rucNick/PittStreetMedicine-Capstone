import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Cargo_Admin = ({ userData }) => {
  const navigate = useNavigate();

  // -------------------- Tabs (Inventory / Images) --------------------
  const [activeTab, setActiveTab] = useState('inventory'); 

  // ==================== 1. Inventory Management ====================
  // 1.1 Show all items
  const [allItems, setAllItems] = useState([]);
  const [allItemsError, setAllItemsError] = useState('');

  const fetchAllItems = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/cargo/items');
      setAllItems(response.data);
      setAllItemsError('');
    } catch (error) {
      setAllItemsError(error.response?.data?.message || error.message);
    }
  }, []);

  // 1.2 add items
  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
  });
  const [newItemImage, setNewItemImage] = useState(null);

  const handleAddNewItem = async () => {
    try {
      const formData = new FormData();
      // form ==> JSON
      formData.append(
        'data',
        new Blob([JSON.stringify(newItemData)], { type: 'application/json' })
      );
      // If there is an image, append it to FormData
      if (newItemImage) {
        formData.append('image', newItemImage);
      }

      const response = await axios.post(
        'http://localhost:8080/api/cargo/items',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Admin-Username': userData.username,
            'Authentication-Status': 'true',
          },
        }
      );

      alert(response.data.message || 'Item added successfully');
      // Clear input
      setNewItemData({ name: '', description: '', category: '', quantity: 0 });
      setNewItemImage(null);
      // Refreshing the list
      fetchAllItems();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // 1.3 update items
  const [updateItemId, setUpdateItemId] = useState('');
  const [updateItemData, setUpdateItemData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
  });
  const [updateItemImage, setUpdateItemImage] = useState(null);

  const handleUpdateItem = async () => {
    if (!updateItemId) {
      alert('Please fill in the Item ID you want to update first');
      return;
    }

    try {
      // First, PUT updates the text data
      const itemUpdateRes = await axios.put(
        `http://localhost:8080/api/cargo/items/${updateItemId}`,
        updateItemData,
        {
          headers: {
            'Admin-Username': userData.username,
            'Authentication-Status': 'true',
          },
        }
      );

      // If the image needs to be updated, it is PUT separately
      if (updateItemImage) {
        const formData = new FormData();
        formData.append('image', updateItemImage);
        await axios.put(
          `http://localhost:8080/api/cargo/items/${updateItemId}?image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Admin-Username': userData.username,
              'Authentication-Status': 'true',
            },
          }
        );
      }

      alert(itemUpdateRes.data.message || 'Item updated successfully');
      fetchAllItems();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // ==================== 2. Image Management ====================
  const [uploadImageFile, setUploadImageFile] = useState(null);
  const [uploadCargoItemId, setUploadCargoItemId] = useState('');

  const handleUploadImage = async () => {
    if (!uploadImageFile) {
      alert('Please select the image file to upload');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', uploadImageFile);
      if (uploadCargoItemId) {
        formData.append('cargoItemId', uploadCargoItemId);
      }

      const response = await axios.post(
        'http://localhost:8080/api/cargo/images/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authentication-Status': 'true',
          },
        }
      );
      alert(response.data.message || 'Image uploaded successfully');
      setUploadImageFile(null);
      setUploadCargoItemId('');
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const [deleteImageId, setDeleteImageId] = useState('');

  const handleDeleteImage = async () => {
    if (!deleteImageId) {
      alert('Please fill in the Image ID you want to delete first');
      return;
    }
    try {
      const response = await axios.delete(
        `http://localhost:8080/api/cargo/images/${deleteImageId}`,
        {
          headers: {
            'Authentication-Status': 'true',
          },
        }
      );
      alert(response.data.message || 'Image deleted successfully');
      setDeleteImageId('');
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // ==================== useEffect ====================
  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchAllItems();
    }
  }, [activeTab, fetchAllItems]);

  // ============================================== HTML =======================================================
  return (
    <div style={styles.container}>
      <h1>Cargo Management page!</h1>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        Back to Admin page
      </button>

      {/* navi Tab */}
      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'inventory' ? styles.activeTabButton : styles.tabButton}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Management
        </button>
        <button
          style={activeTab === 'images' ? styles.activeTabButton : styles.tabButton}
          onClick={() => setActiveTab('images')}
        >
          Image Management
        </button>
      </div>

      {/* ============== Inventory Management ============== */}
      {activeTab === 'inventory' && (
        <div style={styles.section}>
          <h2>Inventory Management</h2>

          {/* 1.1 show all the items */}
          <div style={styles.block}>
            <h3>All Items</h3>
            {allItemsError && <p style={{ color: 'red' }}>{allItemsError}</p>}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 1.2 add items */}
          <div style={styles.block}>
            <h3>Add New Item</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="Name"
              value={newItemData.name}
              onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Description"
              value={newItemData.description}
              onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Category"
              value={newItemData.category}
              onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Quantity"
              value={newItemData.quantity}
              onChange={(e) => setNewItemData({ ...newItemData, quantity: Number(e.target.value) })}
            />

            <input
              type="file"
              onChange={(e) => setNewItemImage(e.target.files[0])}
            />

            <button style={styles.button} onClick={handleAddNewItem}>
              Add Item
            </button>
          </div>

          {/* 1.3 update item */}
          <div style={styles.block}>
            <h3>Update Item</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="Item ID to update"
              value={updateItemId}
              onChange={(e) => setUpdateItemId(e.target.value)}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Name"
              value={updateItemData.name}
              onChange={(e) => setUpdateItemData({ ...updateItemData, name: e.target.value })}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Description"
              value={updateItemData.description}
              onChange={(e) => setUpdateItemData({ ...updateItemData, description: e.target.value })}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Category"
              value={updateItemData.category}
              onChange={(e) => setUpdateItemData({ ...updateItemData, category: e.target.value })}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Quantity"
              value={updateItemData.quantity}
              onChange={(e) => setUpdateItemData({ ...updateItemData, quantity: Number(e.target.value) })}
            />

            <input
              type="file"
              onChange={(e) => setUpdateItemImage(e.target.files[0])}
            />

            <button style={styles.button} onClick={handleUpdateItem}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* ============== Image Management ============== */}
      {activeTab === 'images' && (
        <div style={styles.section}>
          <h2>Image Management</h2>

          {/* 2.1 upload image */}
          <div style={styles.block}>
            <h3>Upload Image</h3>
            <input
              type="file"
              onChange={(e) => setUploadImageFile(e.target.files[0])}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Cargo Item ID (optional)"
              value={uploadCargoItemId}
              onChange={(e) => setUploadCargoItemId(e.target.value)}
            />
            <button style={styles.button} onClick={handleUploadImage}>
              Upload
            </button>
          </div>

          {/* 2.2 delete image */}
          <div style={styles.block}>
            <h3>Delete Image</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="Image ID to delete"
              value={deleteImageId}
              onChange={(e) => setDeleteImageId(e.target.value)}
            />
            <button style={styles.button} onClick={handleDeleteImage}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================== CSS =============================================================
const styles = {
  container: {
    textAlign: 'center',
    padding: '20px',
  },
  backButton: {
    marginBottom: '20px',
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  tabContainer: {
    marginBottom: '20px',
  },
  tabButton: {
    margin: '0 10px',
    padding: '10px 20px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  activeTabButton: {
    margin: '0 10px',
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  section: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    margin: '0 auto',
    maxWidth: '800px',
    textAlign: 'left',
  },
  block: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  input: {
    margin: '0 5px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    backgroundColor: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  table: {
    margin: '0 auto',
    borderCollapse: 'collapse',
    width: '100%',
  },
};

export default Cargo_Admin;
