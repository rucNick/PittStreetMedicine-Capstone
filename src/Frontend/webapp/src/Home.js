//=========================================== JS part ==============================================

import React, { useState } from "react";
import axios from "axios";

// List of example items (unchanged)
const availableItems = [
  { name: "Water", quantity: 0 },
  { name: "Ensure", quantity: 0 },
  { name: "Snapple", quantity: 0 },
  { name: "Wipes", quantity: 0 },
  { name: "Slim Jims", quantity: 0 },
];

const Home = ({ username, userId, onLogout }) => {
  // Order history state
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Cart state
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // <-- new phone number state
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // "Make a New Order" modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [tempItems, setTempItems] = useState(
    availableItems.map((i) => ({ ...i }))
  );

  // Custom item state
  const [customItems, setCustomItems] = useState([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState(0);

  // ============== Fetch order history ==============
  const toggleOrders = async () => {
    if (!userId || typeof userId !== "number") {
      setOrdersError("Order history is not available for guest users.");
      setShowOrders(false);
      return;
    }

    if (!showOrders) {
      try {
        setOrdersLoading(true);
        setOrdersError("");
        const response = await axios.get(
          `http://localhost:8080/api/orders/user/${userId}`,
          {
            params: { authenticated: true, userRole: "CLIENT", userId },
          }
        );

        if (response.data.status === "success") {
          // Filter out cancelled orders
          const filtered = response.data.orders.filter(
            (o) => o.status !== "CANCELLED"
          );
          setOrders(filtered);
        } else {
          setOrdersError(response.data.message || "Failed to load orders.");
        }
      } catch (error) {
        setOrdersError(error.response?.data?.message || "Failed to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    }
    setShowOrders(!showOrders);
  };

  // ============== Cancel order (set status to CANCELLED) ==============
  const handleCancelOrder = async (orderId) => {
    try {
      const payload = {
        authenticated: true,
        userId,
        userRole: "CLIENT",
      };
      const response = await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        payload
      );
      if (response.data.status === "success") {
        // Refresh orders if currently shown
        if (showOrders) {
          await toggleOrders();
          await toggleOrders();
        }
      } else {
        alert(response.data.message || "Failed to cancel order.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order.");
    }
  };

  // ============== Make a New Order ==============
  const handleOpenNewOrder = () => {
    const resetItems = availableItems.map((i) => ({ ...i, quantity: 0 }));
    setTempItems(resetItems);
    // Reset custom items
    setCustomItems([]);
    setCustomItemName("");
    setCustomItemQuantity(0);
    setShowNewOrderModal(true);
  };

  const handleItemQuantityChange = (index, newQuantity) => {
    const updated = [...tempItems];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setTempItems(updated);
  };

  // Handle custom items
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      alert("Please fill in the item name");
      return;
    }
    const quantity = parseInt(customItemQuantity, 10);
    if (!quantity || quantity <= 0) {
      alert("Please fill in the correct quantity");
      return;
    }
    const newItem = { name: customItemName, quantity };
    setCustomItems([...customItems, newItem]);
    setCustomItemName("");
    setCustomItemQuantity(0);
  };

  const handleRemoveCustomItem = (index) => {
    const updated = [...customItems];
    updated.splice(index, 1);
    setCustomItems(updated);
  };

  // Add to cart
  const handleAddToCart = () => {
    const selected = tempItems.filter((i) => i.quantity > 0);
    if (selected.length === 0 && customItems.length === 0) {
      alert("Please select or enter at least one item");
      return;
    }
    const newCart = [...cart];

    // Add preset items
    selected.forEach((sel) => {
      const existingIndex = newCart.findIndex((c) => c.name === sel.name);
      if (existingIndex >= 0) {
        newCart[existingIndex].quantity += sel.quantity;
      } else {
        newCart.push({ name: sel.name, quantity: sel.quantity });
      }
    });
    // Add custom items
    customItems.forEach((item) => {
      const existingIndex = newCart.findIndex((c) => c.name === item.name);
      if (existingIndex >= 0) {
        newCart[existingIndex].quantity += item.quantity;
      } else {
        newCart.push({ name: item.name, quantity: item.quantity });
      }
    });

    setCart(newCart);
    setShowNewOrderModal(false);
  };

  // ============== Cart toggling ==============
  const toggleCart = () => {
    setShowCart(!showCart);
    setCartError("");
    setCartMessage("");
  };

  const handleCartQuantityChange = (index, newQuantity) => {
    const updated = [...cart];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setCart(updated);
  };

  const handleRemoveCartItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // ============== Place new order (CLIENT) ==============
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setCartError("Your cart is empty.");
      return;
    }
    if (!deliveryAddress.trim() || !notes.trim() || !phoneNumber.trim()) {
      setCartError("Please fill in delivery address, phone number, and notes.");
      return;
    }
    setCartError("");
    setCartMessage("");

    try {
      // We include phoneNumber in the payload
      const payload = {
        authenticated: true,
        userId,
        deliveryAddress,
        notes,
        phoneNumber, // <-- new field
        items: cart.map((item) => ({
          itemName: item.name,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(
        "http://localhost:8080/api/orders/create",
        payload
      );

      if (response.data.status !== "success") {
        setCartError(response.data.message || "Order creation failed");
        return;
      }

      setCartMessage("Order placed successfully!");
      // Clear cart and fields
      setCart([]);
      setDeliveryAddress("");
      setNotes("");
      setPhoneNumber(""); // reset phone number as well

      // If orders are open, refresh them
      if (showOrders) {
        await toggleOrders();
        await toggleOrders();
      }
    } catch (error) {
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

  //=========================================== HTML part ==============================================
  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navGreeting}>Hello, {username}!</div>
        <button style={styles.cartButton} onClick={toggleCart}>
          Cart
        </button>
        <button style={styles.logoutButton} onClick={onLogout}>
          Log Out
        </button>
      </div>

      {/* Main content */}
      <div style={styles.content}>
        <h2>Welcome Back, {username}!</h2>
        <div style={styles.buttonRow}>
          <button style={styles.toggleOrdersButton} onClick={toggleOrders}>
            View Orders History
          </button>
          <button style={styles.newOrderButton} onClick={handleOpenNewOrder}>
            Make a New Order
          </button>
        </div>

        {ordersLoading && <p>Loading orders...</p>}
        {ordersError && <p style={styles.errorText}>{ordersError}</p>}

        {showOrders && !ordersLoading && (
          <div style={styles.ordersList}>
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              orders.map((order, idx) => (
                <div key={idx} style={styles.orderItem}>
                  <p>
                    <strong>Order ID:</strong> {order.orderId}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.deliveryAddress}
                  </p>
                  <p>
                    <strong>Notes:</strong> {order.notes}
                  </p>
                  <p>
                    <strong>Request Time:</strong> {order.requestTime}
                  </p>
                  {order.orderItems && order.orderItems.length > 0 ? (
                    <>
                      <p>
                        <strong>Total Items:</strong>{" "}
                        {order.orderItems.length}
                      </p>
                      <ul style={{ marginLeft: "20px" }}>
                        {order.orderItems.map((item, iidx) => (
                          <li key={iidx}>
                            {item.itemName} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>
                      <em>No items found for this order.</em>
                    </p>
                  )}
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleCancelOrder(order.orderId)}
                  >
                    Delete
                  </button>
                  <hr />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* “Make a New Order” modal */}
      {showNewOrderModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Select Items</h3>
            {tempItems.map((item, index) => (
              <div key={item.name} style={styles.itemRow}>
                <label style={{ marginRight: "10px" }}>{item.name}</label>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemQuantityChange(index, e.target.value)
                  }
                  style={{ width: "60px" }}
                />
              </div>
            ))}
            {/* Manually enter items that are not in the list */}
            <div style={{ marginTop: "20px" }}>
              <p>Don't see what you're looking for? Enter below</p>
              <div style={styles.itemRow}>
                <input
                  type="text"
                  placeholder="Item name"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  value={customItemQuantity}
                  onChange={(e) => setCustomItemQuantity(e.target.value)}
                  style={{ width: "60px", marginLeft: "10px" }}
                />
                <button
                  onClick={handleAddCustomItem}
                  style={styles.addCustomButton}
                >
                  Add
                </button>
              </div>
              {customItems.length > 0 && (
                <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                  {customItems.map((item, index) => (
                    <li key={index} style={{ marginBottom: "5px" }}>
                      {item.name} x {item.quantity}{" "}
                      <button
                        onClick={() => handleRemoveCustomItem(index)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button style={styles.button} onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setShowNewOrderModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Your Cart</h3>
            {cart.length === 0 ? (
              <p>No items in cart.</p>
            ) : (
              cart.map((c, index) => (
                <div key={c.name} style={styles.itemRow}>
                  <span>{c.name}</span>
                  <input
                    type="number"
                    min="0"
                    value={c.quantity}
                    onChange={(e) =>
                      handleCartQuantityChange(index, e.target.value)
                    }
                    style={{
                      width: "60px",
                      marginLeft: "10px",
                      marginRight: "10px",
                    }}
                  />
                  <button
                    style={styles.removeButton}
                    onClick={() => handleRemoveCartItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}

            {/* Delivery address, phone number, and notes */}
            <div style={styles.formGroup}>
              <label>Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Phone Number:</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Notes:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={styles.input}
              />
            </div>

            {cartError && <p style={styles.errorText}>{cartError}</p>}
            {cartMessage && <p style={styles.successText}>{cartMessage}</p>}

            <button style={styles.button} onClick={handlePlaceOrder}>
              Place Order
            </button>
            <button style={styles.cancelButton} onClick={toggleCart}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

//=========================================== CSS part ==============================================
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#1890ff",
    color: "white",
    padding: "10px 20px",
    gap: "10px",
  },
  navGreeting: {
    marginRight: "auto",
    fontSize: "20px",
  },
  cartButton: {
    padding: "8px 16px",
    backgroundColor: "#faad14",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
  },
  logoutButton: {
    padding: "8px 16px",
    backgroundColor: "#ff4d4f",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
  },
  content: {
    padding: "20px",
    maxWidth: "800px",
    margin: "20px auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  toggleOrdersButton: {
    padding: "10px 20px",
    backgroundColor: "#1890ff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
  },
  newOrderButton: {
    padding: "10px 20px",
    backgroundColor: "#52c41a",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
  },
  ordersList: {
    marginTop: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    textAlign: "left",
  },
  orderItem: {
    borderBottom: "1px solid #ddd",
    padding: "10px 0",
  },
  deleteButton: {
    marginTop: "10px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  removeButton: {
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
  },
  formGroup: {
    marginBottom: "1rem",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginTop: "4px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  addCustomButton: {
    padding: "6px 12px",
    backgroundColor: "#52c41a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1890ff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    marginTop: "1rem",
  },
  cancelButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#ff4d4f",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    marginTop: "1rem",
  },
  errorText: {
    color: "red",
    fontSize: "14px",
  },
  successText: {
    color: "green",
    fontSize: "14px",
  },
};

export default Home;