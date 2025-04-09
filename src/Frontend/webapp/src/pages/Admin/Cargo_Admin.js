import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Cargo_Admin = ({ userData }) => {
  const baseURL = process.env.REACT_APP_BASE_URL;

  const navigate = useNavigate();
  console.log("Cargo_Admin: Component mounted");

  // -------------------- Tabs (Inventory / Images) --------------------
  const [activeTab, setActiveTab] = useState('inventory');
  console.log("Tabs: Active tab initialized as 'inventory'");

  // ==================== 1. Inventory Management ====================
  // 1.1 Show all items
  const [allItems, setAllItems] = useState([]);
  const [allItemsError, setAllItemsError] = useState('');
  console.log("Inventory Management: Initialized allItems and allItemsError");

  const fetchAllItems = useCallback(async () => {
    console.log("fetchAllItems: Fetching all items from backend");
    try {
      const response = await axios.get(`${baseURL}/api/cargo/items`);
      console.log("fetchAllItems: Received response", response);
      setAllItems(response.data);
      setAllItemsError('');
    } catch (error) {
      console.log("fetchAllItems: Error occurred", error);
      setAllItemsError(error.response?.data?.message || error.message);
    }
  }, [baseURL]);

  // 1.2 Add items - Basic information + multiple size options
  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0, // If there is no size, the user can manually input the quantity
  });
  console.log("Add Item: Initialized newItemData");

  // Store size input entries: each object in the array has { size: string, quantity: number }
  const [newSizeEntries, setNewSizeEntries] = useState([]);
  console.log("Add Item: Initialized newSizeEntries");
  const [newItemImage, setNewItemImage] = useState(null);
  console.log("Add Item: Initialized newItemImage");

  // Add a new size input row
  const handleAddSizeEntry = () => {
    console.log("handleAddSizeEntry: Adding a new size entry");
    setNewSizeEntries([...newSizeEntries, { size: '', quantity: 0 }]);
  };

  // Update the size information for a specific row
  const handleSizeEntryChange = (index, field, value) => {
    console.log(`handleSizeEntryChange: Updating size entry at index ${index} - field: ${field}, value: ${value}`);
    const updated = [...newSizeEntries];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setNewSizeEntries(updated);
  };

  // Delete a specific row's size information
  const handleRemoveSizeEntry = (index) => {
    console.log(`handleRemoveSizeEntry: Removing size entry at index ${index}`);
    const updated = newSizeEntries.filter((_, i) => i !== index);
    setNewSizeEntries(updated);
  };

  /**
   * When adding a new item, if there is size data then the final quantity is the sum of all size quantities;
   * if there is no size data then the quantity entered by the user is used.
   */
  const handleAddNewItem = async () => {
    console.log("handleAddNewItem: Adding new item with data", newItemData, "and size entries", newSizeEntries);
    try {
      // Construct the sizeQuantities object
      const sizeQuantities = {};
      newSizeEntries.forEach((entry) => {
        if (entry.size) {
          sizeQuantities[entry.size] = entry.quantity;
        }
      });
      console.log("handleAddNewItem: Constructed sizeQuantities", sizeQuantities);

      // If there is size data, sum up all the size quantities as the final quantity
      let finalQuantity = newItemData.quantity;
      if (Object.keys(sizeQuantities).length > 0) {
        finalQuantity = Object.values(sizeQuantities).reduce((acc, cur) => acc + cur, 0);
        console.log("handleAddNewItem: Computed finalQuantity from sizes", finalQuantity);
      } else {
        console.log("handleAddNewItem: Using provided quantity", finalQuantity);
      }

      // Merge data, overriding quantity with the final computed value
      const dataToSend = {
        ...newItemData,
        quantity: finalQuantity,
        sizeQuantities,
      };
      console.log("handleAddNewItem: Data to send", dataToSend);

      const formData = new FormData();
      formData.append(
        'data',
        new Blob([JSON.stringify(dataToSend)], { type: 'application/json' })
      );
      // If there is an image, then add it
      if (newItemImage) {
        console.log("handleAddNewItem: Adding image to formData");
        formData.append('image', newItemImage);
      }

      const response = await axios.post(`${baseURL}/api/cargo/items`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Admin-Username': userData.username,
          'Authentication-Status': 'true',
        },
      });
      console.log("handleAddNewItem: Received response", response);

      alert(response.data.message || 'Item added successfully');
      // Clear the input fields
      setNewItemData({ name: '', description: '', category: '', quantity: 0 });
      setNewSizeEntries([]);
      setNewItemImage(null);
      console.log("handleAddNewItem: Cleared new item inputs");
      // Refresh the list
      fetchAllItems();
    } catch (error) {
      console.log("handleAddNewItem: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // 1.3 Update items
  const [updateItemId, setUpdateItemId] = useState('');
  console.log("Update Item: Initialized updateItemId");
  const [updateItemData, setUpdateItemData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
  });
  console.log("Update Item: Initialized updateItemData");
  const [updateItemImage, setUpdateItemImage] = useState(null);
  console.log("Update Item: Initialized updateItemImage");

  const handleUpdateItem = async () => {
    console.log("handleUpdateItem: Updating item with ID", updateItemId);
    if (!updateItemId) {
      console.log("handleUpdateItem: No updateItemId provided");
      alert('Please fill in the Item ID you want to update first');
      return;
    }

    try {
      // First update the text data
      console.log("handleUpdateItem: Sending update request with data", updateItemData);
      const itemUpdateRes = await axios.put(
        `${baseURL}/api/cargo/items/${updateItemId}`,
        updateItemData,
        {
          headers: {
            'Admin-Username': userData.username,
            'Authentication-Status': 'true',
          },
        }
      );
      console.log("handleUpdateItem: Received text update response", itemUpdateRes);

      // If the image needs to be updated, handle it separately
      if (updateItemImage) {
        console.log("handleUpdateItem: Updating image for item", updateItemId);
        const formData = new FormData();
        formData.append('image', updateItemImage);
        await axios.put(
          `${baseURL}/api/cargo/items/${updateItemId}?image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Admin-Username': userData.username,
              'Authentication-Status': 'true',
            },
          }
        );
        console.log("handleUpdateItem: Image update completed");
      }

      alert(itemUpdateRes.data.message || 'Item updated successfully');
      fetchAllItems();
    } catch (error) {
      console.log("handleUpdateItem: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // ==================== 2. Image Management ====================
  const [uploadImageFile, setUploadImageFile] = useState(null);
  console.log("Image Management: Initialized uploadImageFile");
  const [uploadCargoItemId, setUploadCargoItemId] = useState('');
  console.log("Image Management: Initialized uploadCargoItemId");

  const handleUploadImage = async () => {
    console.log("handleUploadImage: Uploading image", uploadImageFile, "for cargo item ID", uploadCargoItemId);
    if (!uploadImageFile) {
      console.log("handleUploadImage: No image file selected");
      alert('Please select the image file to upload');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', uploadImageFile);
      if (uploadCargoItemId) {
        console.log("handleUploadImage: Including cargoItemId", uploadCargoItemId);
        formData.append('cargoItemId', uploadCargoItemId);
      }

      const response = await axios.post(`${baseURL}/api/cargo/images/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authentication-Status': 'true',
        },
      });
      console.log("handleUploadImage: Received response", response);
      alert(response.data.message || 'Image uploaded successfully');
      setUploadImageFile(null);
      setUploadCargoItemId('');
      console.log("handleUploadImage: Cleared upload inputs");
    } catch (error) {
      console.log("handleUploadImage: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  const [deleteImageId, setDeleteImageId] = useState('');
  console.log("Image Management: Initialized deleteImageId");

  const handleDeleteImage = async () => {
    console.log("handleDeleteImage: Deleting image with ID", deleteImageId);
    if (!deleteImageId) {
      console.log("handleDeleteImage: No deleteImageId provided");
      alert('Please fill in the Image ID you want to delete first');
      return;
    }
    try {
      const response = await axios.delete(
        `${baseURL}/api/cargo/images/${deleteImageId}`,
        {
          headers: {
            'Authentication-Status': 'true',
          },
        }
      );
      console.log("handleDeleteImage: Received response", response);
      alert(response.data.message || 'Image deleted successfully');
      setDeleteImageId('');
      console.log("handleDeleteImage: Cleared deleteImageId");
    } catch (error) {
      console.log("handleDeleteImage: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // ==================== useEffect ====================
  useEffect(() => {
    console.log("useEffect: activeTab changed to", activeTab);
    if (activeTab === 'inventory') {
      console.log("useEffect: activeTab is 'inventory', calling fetchAllItems");
      fetchAllItems();
    }
  }, [activeTab, fetchAllItems]);

  // ============================================== HTML =======================================================
  return (
    <div style={styles.container}>
      <h1>Cargo Management page!</h1>
      <button
        style={styles.backButton}
        onClick={() => {
          console.log("Navigation: Back to Admin page clicked");
          navigate(-1);
        }}
      >
        Back to Admin page
      </button>

      {/* Navi Tab */}
      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'inventory' ? styles.activeTabButton : styles.tabButton}
          onClick={() => {
            console.log("Navigation: Switching to Inventory Management tab");
            setActiveTab('inventory');
          }}
        >
          Inventory Management
        </button>
        <button
          style={activeTab === 'images' ? styles.activeTabButton : styles.tabButton}
          onClick={() => {
            console.log("Navigation: Switching to Image Management tab");
            setActiveTab('images');
          }}
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
                        {/* If item.quantity < 5, display (Low-Stock!) in red */}
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

          {/* 1.2 Add New Item */}
          <div style={styles.block}>
            <h3>Add New Item</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="Name"
              value={newItemData.name}
              onChange={(e) => {
                console.log("Add New Item: Name changed to", e.target.value);
                setNewItemData({ ...newItemData, name: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Description"
              value={newItemData.description}
              onChange={(e) => {
                console.log("Add New Item: Description changed to", e.target.value);
                setNewItemData({ ...newItemData, description: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Category"
              value={newItemData.category}
              onChange={(e) => {
                console.log("Add New Item: Category changed to", e.target.value);
                setNewItemData({ ...newItemData, category: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Quantity (if no sizes)"
              value={newItemData.quantity}
              onChange={(e) => {
                console.log("Add New Item: Quantity changed to", e.target.value);
                setNewItemData({ ...newItemData, quantity: Number(e.target.value) });
              }}
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
                    onChange={(e) => {
                      console.log(`Size Option: Size at index ${index} changed to`, e.target.value);
                      handleSizeEntryChange(index, 'size', e.target.value);
                    }}
                  />
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="Quantity for this size"
                    value={entry.quantity}
                    onChange={(e) => {
                      console.log(`Size Option: Quantity at index ${index} changed to`, e.target.value);
                      handleSizeEntryChange(index, 'quantity', e.target.value);
                    }}
                  />
                  <button style={styles.smallButton} onClick={() => {
                    console.log(`Size Option: Remove button clicked for index ${index}`);
                    handleRemoveSizeEntry(index);
                  }}>
                    Remove
                  </button>
                </div>
              ))}
              <button style={styles.button} onClick={handleAddSizeEntry}>
                Add Size Option
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <input type="file" onChange={(e) => {
                console.log("Add New Item: New item image selected", e.target.files[0]);
                setNewItemImage(e.target.files[0]);
              }} />
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
              onChange={(e) => {
                console.log("Update Item: Item ID changed to", e.target.value);
                setUpdateItemId(e.target.value);
              }}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Name"
              value={updateItemData.name}
              onChange={(e) => {
                console.log("Update Item: Name changed to", e.target.value);
                setUpdateItemData({ ...updateItemData, name: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Description"
              value={updateItemData.description}
              onChange={(e) => {
                console.log("Update Item: Description changed to", e.target.value);
                setUpdateItemData({ ...updateItemData, description: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Category"
              value={updateItemData.category}
              onChange={(e) => {
                console.log("Update Item: Category changed to", e.target.value);
                setUpdateItemData({ ...updateItemData, category: e.target.value });
              }}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Quantity"
              value={updateItemData.quantity}
              onChange={(e) => {
                console.log("Update Item: Quantity changed to", e.target.value);
                setUpdateItemData({ ...updateItemData, quantity: Number(e.target.value) });
              }}
            />

            <div style={{ marginTop: '10px' }}>
              <input type="file" onChange={(e) => {
                console.log("Update Item: New update image selected", e.target.files[0]);
                setUpdateItemImage(e.target.files[0]);
              }} />
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
            <input type="file" onChange={(e) => {
              console.log("Image Management: Upload image file selected", e.target.files[0]);
              setUploadImageFile(e.target.files[0]);
            }} />
            <input
              style={styles.input}
              type="text"
              placeholder="Cargo Item ID (optional)"
              value={uploadCargoItemId}
              onChange={(e) => {
                console.log("Image Management: Cargo Item ID changed to", e.target.value);
                setUploadCargoItemId(e.target.value);
              }}
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
              onChange={(e) => {
                console.log("Image Management: Delete Image ID changed to", e.target.value);
                setDeleteImageId(e.target.value);
              }}
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
    width: '90%',
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
  // Updated table style to show horizontal and vertical lines
  table: {
    margin: '0 auto',
    borderCollapse: 'collapse', // Ensures that border lines are drawn as a single line
    width: '100%',
  },
  // Below styles can be used if you decide to add <th style={styles.tableHeaderCell}> or <td style={styles.tableCell}>
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

export default Cargo_Admin;
