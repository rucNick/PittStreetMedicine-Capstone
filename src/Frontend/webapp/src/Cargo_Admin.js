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

  // 1.2 Add items - Basic information + multiple size options
  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0, // If there is no size, the user can manually input the quantity
  });
  // Store size input entries: each object in the array has the format { size: string, quantity: number }
  const [newSizeEntries, setNewSizeEntries] = useState([]);
  const [newItemImage, setNewItemImage] = useState(null);

  // Add a new size input row
  const handleAddSizeEntry = () => {
    setNewSizeEntries([...newSizeEntries, { size: '', quantity: 0 }]);
  };

  // Update the size information for a specific row
  const handleSizeEntryChange = (index, field, value) => {
    const updated = [...newSizeEntries];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setNewSizeEntries(updated);
  };

  // Delete a specific row's size information
  const handleRemoveSizeEntry = (index) => {
    const updated = newSizeEntries.filter((_, i) => i !== index);
    setNewSizeEntries(updated);
  };

  /**
   * When adding a new item, if there is size data then the final quantity is the sum of all size quantities;
   * if there is no size data then the quantity entered by the user is used.
   */
  const handleAddNewItem = async () => {
    try {
      // Construct the sizeQuantities object
      const sizeQuantities = {};
      newSizeEntries.forEach((entry) => {
        if (entry.size) {
          sizeQuantities[entry.size] = entry.quantity;
        }
      });

      // If there is size data, sum up all the size quantities as the final quantity
      let finalQuantity = newItemData.quantity;
      if (Object.keys(sizeQuantities).length > 0) {
        finalQuantity = Object.values(sizeQuantities).reduce((acc, cur) => acc + cur, 0);
      }

      // Merge data, overriding quantity with the final computed value
      const dataToSend = {
        ...newItemData,
        quantity: finalQuantity,
        sizeQuantities,
      };

      const formData = new FormData();
      formData.append(
        'data',
        new Blob([JSON.stringify(dataToSend)], { type: 'application/json' })
      );
      // If there is an image, then add it
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
      // Clear the input fields
      setNewItemData({ name: '', description: '', category: '', quantity: 0 });
      setNewSizeEntries([]);
      setNewItemImage(null);
      // Refresh the list
      fetchAllItems();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // 1.3 Update items (if you need to update size, you can extend this as needed)
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
      // First update the text data
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

      // If the image needs to be updated, handle it separately
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

      {/* Navi Tab */}
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

          {/* 1.1 Show all items */}
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
                  <React.Fragment key={item.id}>
                    <tr>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td>{item.category}</td>
                      <td>{item.quantity}</td>
                    </tr>
                    {/* If there is size information, display additional rows */}
                    {item.sizeQuantities && Object.keys(item.sizeQuantities).length > 0 && (
                      Object.entries(item.sizeQuantities).map(([size, qty]) => (
                        <tr key={item.id + size}>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>{size}</td>
                          <td>{qty}</td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* 1.2 Add New Item */}
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
              placeholder="Quantity (if no sizes)"
              value={newItemData.quantity}
              onChange={(e) => setNewItemData({ ...newItemData, quantity: Number(e.target.value) })}
            />

            {/* Size Options */}
            <div style={{ marginTop: '10px' }}>
              <h4>Size Options (optional)</h4>
              {newSizeEntries.map((entry, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Size (e.g., S, M, L)"
                    value={entry.size}
                    onChange={(e) => handleSizeEntryChange(index, 'size', e.target.value)}
                  />
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="Quantity for this size"
                    value={entry.quantity}
                    onChange={(e) => handleSizeEntryChange(index, 'quantity', e.target.value)}
                  />
                  <button style={styles.smallButton} onClick={() => handleRemoveSizeEntry(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button style={styles.button} onClick={handleAddSizeEntry}>
                Add Size Option
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <input type="file" onChange={(e) => setNewItemImage(e.target.files[0])} />
            </div>
            <button style={styles.button} onClick={handleAddNewItem}>
              Add Item
            </button>
          </div>

          {/* 1.3 Update Item */}
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

            <div style={{ marginTop: '10px' }}>
              <input type="file" onChange={(e) => setUpdateItemImage(e.target.files[0])} />
            </div>
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

          {/* 2.1 Upload Image */}
          <div style={styles.block}>
            <h3>Upload Image</h3>
            <input type="file" onChange={(e) => setUploadImageFile(e.target.files[0])} />
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

          {/* 2.2 Delete Image */}
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
    marginTop: '10px',
    marginLeft: '10px',
    padding: '8px 16px',
    backgroundColor: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  smallButton: {
    padding: '4px 8px',
    backgroundColor: '#f5222d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '5px',
  },
  table: {
    margin: '0 auto',
    borderCollapse: 'collapse',
    width: '100%',
  },
};

export default Cargo_Admin;
