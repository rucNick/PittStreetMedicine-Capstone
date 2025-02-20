import React, { useState } from "react";
import axios from "axios";

// List of example items
const availableItems = [
  { name: "Water", quantity: 0 },
  { name: "Ensure", quantity: 0 },
  { name: "Snapple", quantity: 0 },
  { name: "Wipes", quantity: 0 },
  { name: "Slim Jims", quantity: 0 },
];

const Home = ({ username, userId, onLogout }) => {
  // Order history status
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Cart status
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [tempItems, setTempItems] = useState(
    availableItems.map((i) => ({ ...i }))
  );

  // ============== get order history ==============
  const toggleOrders = async () => {
    console.log("toggleOrders called, current showOrders:", showOrders);
    if (!userId || typeof userId !== "number") {
      console.log("Guest user detected. Order history is not available.");
      setOrdersError("Order history is not available for guest users.");
      setShowOrders(false);
      return;
    }
    if (!showOrders) {
      try {
        setOrdersLoading(true);
        setOrdersError("");
        console.log("Fetching orders for userId:", userId);

        const response = await axios.get(
          `http://localhost:8080/api/orders/user/${userId}`,
          {
            params: { authenticated: true, userRole: "CLIENT", userId },
          }
        );

        if (response.data.status === "success") {
          // filter status === "CANCELLED"
          const filtered = response.data.orders.filter(
            (o) => o.status !== "CANCELLED"
          );
          console.log("Orders fetched:", filtered);
          setOrders(filtered);
        } else {
          console.log("Error fetching orders:", response.data.message);
          setOrdersError(response.data.message || "Failed to load orders.");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersError(
          error.response?.data?.message || "Failed to load orders."
        );
      } finally {
        setOrdersLoading(false);
      }
    }
    setShowOrders(!showOrders);
    console.log("toggleOrders, new showOrders state:", !showOrders);
  };

  // ============== cancel order ==============
  const handleCancelOrder = async (orderId) => {
    console.log("Attempting to cancel order with orderId:", orderId);
    try {
      const payload = {
        authenticated: true,
        userId,
        userRole: "CLIENT",
      };
      // /api/orders/{orderId}/cancel
      const response = await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        payload
      );
      if (response.data.status === "success") {
        console.log("Order cancelled successfully:", orderId);
        // After successful cancellation, reload the order list
        if (showOrders) {
          await toggleOrders();
          await toggleOrders();
        }
      } else {
        console.log("Cancel order error:", response.data.message);
        alert(response.data.message || "Failed to cancel order.");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      alert(error.response?.data?.message || "Failed to cancel order.");
    }
  };

  const handleOpenNewOrder = () => {
    console.log("Opening new order modal");
    const resetItems = availableItems.map((i) => ({ ...i, quantity: 0 }));
    setTempItems(resetItems);
    setShowNewOrderModal(true);
  };

  // change quantity
  const handleItemQuantityChange = (index, newQuantity) => {
    console.log(`Changing quantity for item at index ${index} to ${newQuantity}`);
    const updated = [...tempItems];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setTempItems(updated);
  };

  // “Add to Cart”
  const handleAddToCart = () => {
    console.log("Adding items to cart, current tempItems:", tempItems);
    const selected = tempItems.filter((i) => i.quantity > 0);
    if (selected.length === 0) {
      alert("Please select at least one item.");
      return;
    }
    const newCart = [...cart];
    selected.forEach((sel) => {
      const existingIndex = newCart.findIndex((c) => c.name === sel.name);
      if (existingIndex >= 0) {
        newCart[existingIndex].quantity += sel.quantity;
      } else {
        newCart.push({ name: sel.name, quantity: sel.quantity });
      }
    });
    console.log("New cart state after adding items:", newCart);
    setCart(newCart);
    setShowNewOrderModal(false);
  };

  const toggleCart = () => {
    setShowCart(!showCart);
    setCartError("");
    setCartMessage("");
    console.log("Toggled cart, new showCart state:", !showCart);
  };

  // change quantity in Cart
  const handleCartQuantityChange = (index, newQuantity) => {
    console.log(`Changing cart item at index ${index} to quantity ${newQuantity}`);
    const updated = [...cart];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setCart(updated);
  };

  // remove item in Cart
  const handleRemoveCartItem = (index) => {
    console.log(`Removing cart item at index ${index}`);
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Submit a new order (each item calls the create backend separately)
  const handlePlaceOrder = async () => {
    console.log("Placing order with cart items:", cart);
    if (cart.length === 0) {
      setCartError("Your cart is empty.");
      return;
    }
    if (!deliveryAddress.trim() || !notes.trim()) {
      setCartError("Please fill in delivery address and notes.");
      return;
    }
    setCartError("");
    setCartMessage("");

    try {
      const payload = {
        authenticated: true,
        userId,
        deliveryAddress,
        notes,
        items: cart.map(item => ({
          itemName: item.name,
          quantity: item.quantity
        }))
      };

      console.log("Sending order to backend. Payload:", payload);
      const response = await axios.post(
        "http://localhost:8080/api/orders/create",
        payload
      );

      console.log("Received response from backend:", response.data);

      if (response.data.status !== "success") {
        console.log("Order creation failed:", response.data.message);
        setCartError(
          response.data.message || "Order creation failed"
        );
        return;
      }

      console.log("Order placed successfully");
      setCartMessage("Order placed successfully!");
      setCart([]);
      setDeliveryAddress("");
      setNotes("");

      if (showOrders) {
        await toggleOrders();
        await toggleOrders();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

  return (
    <div style={styles.container}>
      {/* nav bar */}
      <div style={styles.navbar}>
        <div style={styles.navGreeting}>Hello, {username}!</div>
        <button style={styles.cartButton} onClick={toggleCart}>
          Cart
        </button>
        <button style={styles.logoutButton} onClick={onLogout}>
          Log Out
        </button>
      </div>

      {/* main content */}
      <div style={styles.content}>
        <h2>Welcome Back, {username}!</h2>
        <button style={styles.toggleOrdersButton} onClick={toggleOrders}>
          View Orders History
        </button>
        {ordersLoading && <p>Loading orders...</p>}
        {ordersError && <p style={styles.errorText}>{ordersError}</p>}
        {showOrders && !ordersLoading && (
          <div style={styles.ordersList}>
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              orders.map((order, idx) => (
                <div key={idx} style={styles.orderItem}>
                  <p>Order ID: {order.orderId}</p>
                  <p>Address: {order.deliveryAddress}</p>
                  <p>Notes: {order.notes}</p>
                  <p>Request Time: {order.requestTime}</p>
                  <p>Item: {order.itemName}</p>
                  <p>Quantity: {order.quantity}</p>

                  {/* cancel button */}
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
        <button style={styles.newOrderButton} onClick={handleOpenNewOrder}>
          Make a New Order
        </button>
      </div>

      {/* “Make a New Order” box */}
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
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button style={styles.button} onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  console.log("Closing new order modal");
                  setShowNewOrderModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* cart box */}
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
                    onChange={(e) => handleCartQuantityChange(index, e.target.value)}
                    style={{ width: "60px", marginLeft: "10px", marginRight: "10px" }}
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

            {/* address & note */}
            <div style={styles.formGroup}>
              <label>Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  console.log("Delivery address changed to:", e.target.value);
                  setDeliveryAddress(e.target.value);
                }}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Notes:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => {
                  console.log("Notes changed to:", e.target.value);
                  setNotes(e.target.value);
                }}
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
  toggleOrdersButton: {
    padding: "10px 20px",
    backgroundColor: "#1890ff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    marginBottom: "10px",
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
  newOrderButton: {
    padding: "10px 20px",
    backgroundColor: "#52c41a",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    marginTop: "20px",
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
