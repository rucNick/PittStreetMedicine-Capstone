//=========================================== JS part ==============================================

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const availableItems = [
  { name: "Water", quantity: 0 },
  { name: "Ensure", quantity: 0 },
  { name: "Snapple", quantity: 0 },
  { name: "Wipes", quantity: 0 },
  { name: "Slim Jims", quantity: 0 },
];

const Guest = ({ onLogout }) => {
  const navigate = useNavigate();

  // ========== cart status ==========
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]); // [{ name, quantity }, ...]
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");

  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // ========== “Make a New Order” box ==========
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [tempItems, setTempItems] = useState(
    availableItems.map((i) => ({ ...i }))
  );

  // New: custom items state
  const [customItems, setCustomItems] = useState([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState(0);

  // ========== current order box ==========
  const [showCurrentOrderModal, setShowCurrentOrderModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ========== Logout ==========
  const handleLogout = () => {
    onLogout();
    navigate("/"); // back to login
  };

  // ========== open “Make a New Order” box ==========
  const handleOpenNewOrder = () => {
    // Reset temporary item selection
    const resetItems = availableItems.map((i) => ({ ...i, quantity: 0 }));
    setTempItems(resetItems);
    // New: reset custom items state
    setCustomItems([]);
    setCustomItemName("");
    setCustomItemQuantity(0);
    setShowNewOrderModal(true);
  };

  // change item quantities in “Make a New Order” box
  const handleItemQuantityChange = (index, newQuantity) => {
    const updated = [...tempItems];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setTempItems(updated);
  };

  // New: handle adding a custom item
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      alert("Please enter the item name");
      return;
    }
    const quantity = parseInt(customItemQuantity, 10);
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    const newItem = { name: customItemName, quantity };
    setCustomItems([...customItems, newItem]);
    setCustomItemName("");
    setCustomItemQuantity(0);
  };

  // New: handle removing a custom item
  const handleRemoveCustomItem = (index) => {
    const updated = [...customItems];
    updated.splice(index, 1);
    setCustomItems(updated);
  };

  // move seleted item to cart
  const handleAddToCart = () => {
    const selected = tempItems.filter((i) => i.quantity > 0);
    if (selected.length === 0 && customItems.length === 0) {
      alert("Please select or add at least one item.");
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

  // open cart
  const toggleCart = () => {
    setShowCart(!showCart);
    setCartError("");
    setCartMessage("");
  };

  // change quantitoes in cart
  const handleCartQuantityChange = (index, newQuantity) => {
    const updated = [...cart];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setCart(updated);
  };

  // remove items in cart
  const handleRemoveCartItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // ========== place order：POST /api/orders/guest/create ==========
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setCartError("Your cart is empty.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setCartError("Please fill in delivery address.");
      return;
    }
    if (
      !guestFirstName.trim() ||
      !guestLastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !guestNotes.trim()
    ) {
      setCartError(
        "Please fill in first name, last name, email, phone, and notes."
      );
      return;
    }
    setCartError("");
    setCartMessage("");

    try {
      const combinedUserNotes = `FirstName: ${guestFirstName}; LastName: ${guestLastName}; ${guestNotes}`;

      // payload
      const payload = {
        firstName: guestFirstName,
        lastName: guestLastName,
        email,
        phone,
        deliveryAddress,
        // notes include first name and last name
        notes: combinedUserNotes,
        items: cart.map((c) => ({
          itemName: c.name,
          quantity: c.quantity,
        })),
      };

      const response = await axios.post(
        "http://localhost:8080/api/orders/guest/create",
        payload
      );

      if (response.data.status === "success") {
        setCartMessage("Order placed successfully!");

        // generate currentOrder
        const newOrder = {
          orderId: response.data.orderId,
          orderStatus: response.data.orderStatus || "PENDING",
          firstName: guestFirstName,
          lastName: guestLastName,
          address: deliveryAddress,
          notes: combinedUserNotes,
          items: cart, // items in cart
        };

        setCurrentOrder(newOrder);
        setShowCurrentOrderModal(true);

        // clean cart & form
        setCart([]);
        setDeliveryAddress("");
        setGuestFirstName("");
        setGuestLastName("");
        setEmail("");
        setPhone("");
        setGuestNotes("");
      } else {
        setCartError(response.data.message || "Order creation failed.");
      }
    } catch (error) {
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

//=========================================== HTML part ==============================================

  return (
    <div style={styles.container}>
      {/* top nav bar */}
      <div style={styles.navbar}>
        <div style={styles.navGreeting}>Welcome, Guest!</div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {/* Cannot view order history, can only place an order */}
      <div style={styles.content}>
        <h2>Make a New Order as Guest</h2>
        <button style={styles.newOrderButton} onClick={handleOpenNewOrder}>
          Make a New Order
        </button>
        <button style={styles.cartButton} onClick={toggleCart}>
          Cart ({cart.length})
        </button>
      </div>

      {/* “Make a New Order” box open */}
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
            {/* New: Custom item input section */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <p>Didn't find the item you're looking for? Enter it below</p>
              <div style={styles.itemRow}>
                <input
                  type="text"
                  placeholder="Item Name"
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

      {/* cart box open */}
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

            {/* Required information: Address, firstName, lastName, email, phone, note */}
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
              <label>First Name:</label>
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Last Name:</label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Email:</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Phone:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Notes:</label>
              <input
                type="text"
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
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

      {/* Current order information popup (only displayed after successful order) */}
      {showCurrentOrderModal && currentOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {/* red note */}
            <p style={{ color: "red", fontSize: "18px", fontStyle: "italic" }}>
              NOTE: Please be sure to remember this information! Make sure you have taken a screenshot or written it down!
            </p>

            <h3>Current Order</h3>
            <p><strong>Order ID:</strong> {currentOrder.orderId}</p>
            <p><strong>Status:</strong> {currentOrder.orderStatus}</p>
            <p>
              <strong>Guest Name:</strong> {currentOrder.firstName}{" "}
              {currentOrder.lastName}
            </p>
            <p><strong>Address:</strong> {currentOrder.address}</p>
            <p><strong>Notes:</strong> {currentOrder.notes}</p>
            <div style={{ margin: "10px 0" }}>
              <strong>Items:</strong>
              {currentOrder.items.map((item, idx) => (
                <div key={idx}>
                  {item.name} x {item.quantity}
                </div>
              ))}
            </div>
            <button
              style={styles.button}
              onClick={() => setShowCurrentOrderModal(false)}
            >
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1890ff",
    color: "white",
    padding: "10px 20px",
  },
  navGreeting: {
    fontSize: "20px",
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
  newOrderButton: {
    padding: "10px 20px",
    backgroundColor: "#52c41a",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
    marginRight: "10px",
  },
  cartButton: {
    padding: "10px 20px",
    backgroundColor: "#faad14",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
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
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "1rem",
  },
  cancelButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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

export default Guest;
