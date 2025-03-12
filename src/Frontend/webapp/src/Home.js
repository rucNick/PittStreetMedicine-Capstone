//=========================================== JS part ==============================================

import React, { useState } from "react";
import axios from "axios";

const Home = ({ username, email, password, phone, userId, onLogout }) => {
  // ============== Order History & UI States ==============
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // ============== Cart States ==============
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // If empty, will use registered phone
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // ============== "Make a New Order" - Cargo Items ==============
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [cargoItems, setCargoItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // ============== Feedback States ==============
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackPhoneNumber, setFeedbackPhoneNumber] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // ============== Profile Update States ==============
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Field selection state: "username", "email", "password", or "phone"
  const [profileOption, setProfileOption] = useState("username");
  // Input states for profile update
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // ================= Order History, Cancel Order, Fetch Cargo Items, etc. =================
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
          { params: { authenticated: true, userRole: "CLIENT", userId } }
        );
        if (response.data.status === "success") {
          const filtered = response.data.orders.filter((o) => o.status !== "CANCELLED");
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

  const handleCancelOrder = async (orderId) => {
    try {
      const payload = { authenticated: true, userId, userRole: "CLIENT" };
      const response = await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        payload
      );
      if (response.data.status === "success") {
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

  const fetchCargoItems = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/cargo/items");
      setCargoItems(response.data);
    } catch (error) {
      console.error("Failed to fetch cargo items:", error);
    }
  };

  const handleOpenNewOrder = () => {
    setShowNewOrder(true);
    fetchCargoItems();
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
    const sizes = item.sizeQuantities ? Object.keys(item.sizeQuantities) : [];
    setSelectedSize(sizes.length > 0 ? sizes[0] : "");
    setSelectedQuantity(1);
  };

  const closeItemDetailModal = () => {
    setShowItemDetailModal(false);
    setSelectedItem(null);
    setSelectedSize("");
    setSelectedQuantity(1);
  };

  const handleAddSelectedItemToCart = () => {
    if (!selectedItem) return;
    if (selectedQuantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    const itemName = selectedSize ? `${selectedItem.name} (${selectedSize})` : selectedItem.name;
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((c) => c.name === itemName);
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += selectedQuantity;
    } else {
      newCart.push({ name: itemName, quantity: selectedQuantity });
    }
    setCart(newCart);
    closeItemDetailModal();
  };

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

  const handlePlaceOrder = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          placeOrderWithLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {
          placeOrderWithLocation(null, null);
        }
      );
    } else {
      placeOrderWithLocation(null, null);
    }
  };

  const placeOrderWithLocation = async (latitude, longitude) => {
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
      const payload = {
        authenticated: true,
        userId,
        deliveryAddress,
        notes,
        phoneNumber,
        items: cart.map((item) => ({ itemName: item.name, quantity: item.quantity })),
      };
      if (latitude !== null && longitude !== null) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }
      const response = await axios.post("http://localhost:8080/api/orders/create", payload);
      if (response.data.status !== "success") {
        setCartError(response.data.message || "Order creation failed");
        return;
      }
      setCartMessage("Order placed successfully!");
      setCart([]);
      setDeliveryAddress("");
      setNotes("");
      setPhoneNumber("");
      if (showOrders) {
        await toggleOrders();
        await toggleOrders();
      }
    } catch (error) {
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

  const handleOpenFeedbackModal = () => {
    setFeedbackContent("");
    setFeedbackPhoneNumber("");
    setFeedbackError("");
    setFeedbackMessage("");
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      setFeedbackError("Feedback content cannot be empty.");
      return;
    }
    if (!feedbackPhoneNumber.trim()) {
      setFeedbackError("Phone number is required.");
      return;
    }
    setFeedbackError("");
    try {
      const payload = {
        name: username,
        phoneNumber: feedbackPhoneNumber,
        content: feedbackContent
      };
      const response = await axios.post("http://localhost:8080/api/feedback/submit", payload);
      if (response.data.status === "success") {
        setFeedbackMessage("Feedback submitted successfully!");
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackContent("");
          setFeedbackPhoneNumber("");
          setFeedbackMessage("");
        }, 1500);
      } else {
        setFeedbackError(response.data.message || "Failed to submit feedback.");
      }
    } catch (error) {
      setFeedbackError(error.response?.data?.message || "Failed to submit feedback.");
    }
  };

  // ------------- Profile Modal Operations -------------

  // Open profile modal and clear previous inputs
  const handleOpenProfileModal = () => {
    setCurrentPassword("");
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewPhone("");
    setProfileError("");
    setProfileMessage("");
    setProfileOption("username"); // Default option
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  // Handle submit of profile update based on selected option
  const handleSubmitProfile = async () => {
    // For username update
    if (profileOption === "username") {
      // Validate new username: only letters and must differ from current username
      const usernameRegex = /^[A-Za-z]+$/;
      if (!newUsername.trim() || !usernameRegex.test(newUsername.trim())) {
        setProfileError("Username must contain only letters.");
        return;
      }
      if (newUsername.trim() === username) {
        setProfileError("New username must be different from the old one.");
        return;
      }
      try {
        await axios.put("http://localhost:8080/api/auth/update/username", {
          userId,
          newUsername: newUsername.trim(),
          authenticated: "true"
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => onLogout(), 1500);
      } catch (error) {
        setProfileError(error.response?.data?.message || "Failed to update username.");
      }
    }
    // For email update
    else if (profileOption === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newEmail.trim() || !emailRegex.test(newEmail.trim())) {
        setProfileError("Please enter a valid email address.");
        return;
      }
      if (newEmail.trim() === email) {
        setProfileError("New email must be different from the old one.");
        return;
      }
      if (!currentPassword.trim()) {
        setProfileError("Current password is required.");
        return;
      }
      try {
        await axios.put("http://localhost:8080/api/auth/update/email", {
          userId,
          currentPassword: currentPassword.trim(),
          newEmail: newEmail.trim(),
          authenticated: "true"
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => onLogout(), 1500);
      } catch (error) {
        setProfileError(error.response?.data?.message || "Failed to update email.");
      }
    }
    // For password update
    else if (profileOption === "password") {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!newPassword.trim() || !passwordRegex.test(newPassword.trim())) {
        setProfileError("Password must be alphanumeric and at least 8 characters long.");
        return;
      }
      if (newPassword.trim() === password) {
        setProfileError("New password must be different from the old one.");
        return;
      }
      if (!currentPassword.trim()) {
        setProfileError("Current password is required.");
        return;
      }
      try {
        await axios.put("http://localhost:8080/api/auth/update/password", {
          userId,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          authenticated: "true"
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => onLogout(), 1500);
      } catch (error) {
        setProfileError(error.response?.data?.message || "Failed to update password.");
      }
    }
    // For phone update
    else if (profileOption === "phone") {
      const phoneRegex = /^\d{10}$/;
      if (!newPhone.trim() || !phoneRegex.test(newPhone.trim())) {
        setProfileError("Phone number must be a 10-digit US number.");
        return;
      }
      if (newPhone.trim() === phone) {
        setProfileError("New phone number must be different from the old one.");
        return;
      }
      if (!currentPassword.trim()) {
        setProfileError("Current password is required.");
        return;
      }
      try {
        await axios.put("http://localhost:8080/api/auth/update/phone", {
          userId,
          currentPassword: currentPassword.trim(),
          newPhone: newPhone.trim(),
          authenticated: "true"
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => onLogout(), 1500);
      } catch (error) {
        setProfileError(error.response?.data?.message || "Failed to update phone number.");
      }
    }
  };

  // ================= Rendering Section =================
  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navGreeting}>
          {/* Display current username and Profile button */}
          Hello, {username}!
          <button style={styles.profileButton} onClick={handleOpenProfileModal}>
            Profile
          </button>
        </div>
        <button style={styles.feedbackButton} onClick={handleOpenFeedbackModal}>
          Feedback
        </button>
        <button style={styles.cartButton} onClick={toggleCart}>
          Cart
        </button>
        <button style={styles.logoutButton} onClick={onLogout}>
          Log Out
        </button>
      </div>

      {/* Main Content */}
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
                  <p><strong>Order ID:</strong> {order.orderId}</p>
                  <p><strong>Address:</strong> {order.deliveryAddress}</p>
                  <p><strong>Notes:</strong> {order.notes}</p>
                  <p><strong>Request Time:</strong> {order.requestTime}</p>
                  {order.orderItems && order.orderItems.length > 0 ? (
                    <>
                      <p><strong>Total Items:</strong> {order.orderItems.length}</p>
                      <ul style={{ marginLeft: "20px" }}>
                        {order.orderItems.map((item, iidx) => (
                          <li key={iidx}>
                            {item.itemName} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p><em>No items found for this order.</em></p>
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
        {showNewOrder && (
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <h3>Available Items</h3>
            <div style={styles.itemGrid}>
              {cargoItems.length === 0 ? (
                <p>No items found in cargo.</p>
              ) : (
                cargoItems.map((item) => (
                  <div
                    key={item.id}
                    style={styles.itemCard}
                    onClick={() => handleSelectItem(item)}
                  >
                    {item.imageId ? (
                      <img
                        src={`http://localhost:8080/api/cargo/images/${item.imageId}`}
                        alt={item.name}
                        style={styles.itemImage}
                      />
                    ) : (
                      <div style={styles.itemImagePlaceholder}>
                        No Image
                      </div>
                    )}
                    <h4>{item.name}</h4>
                    <p style={{ fontSize: "14px", color: "#999" }}>
                      {item.category}
                    </p>
                    <p style={{ fontSize: "14px" }}>
                      Total Stock: {item.quantity}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {showItemDetailModal && selectedItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ textAlign: "center" }}>
              {selectedItem.imageId ? (
                <img
                  src={`http://localhost:8080/api/cargo/images/${selectedItem.imageId}`}
                  alt={selectedItem.name}
                  style={{ width: "200px", marginBottom: "10px" }}
                />
              ) : (
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    backgroundColor: "#eee",
                    margin: "0 auto 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  No Image
                </div>
              )}
              <h3>{selectedItem.name}</h3>
              <p>{selectedItem.description}</p>
              <p style={{ fontSize: "14px", color: "#999" }}>
                Category: {selectedItem.category || "N/A"}
              </p>
            </div>
            {selectedItem.sizeQuantities &&
              Object.keys(selectedItem.sizeQuantities).length > 0 && (
                <div style={{ margin: "10px 0" }}>
                  <label style={{ marginRight: "8px" }}>Size:</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    {Object.entries(selectedItem.sizeQuantities).map(
                      ([size, qty]) => (
                        <option key={size} value={size}>
                          {size} (stock: {qty})
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
            <div style={{ margin: "10px 0" }}>
              <label style={{ marginRight: "8px" }}>Quantity:</label>
              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                style={{ width: "60px" }}
              />
            </div>
            <button style={styles.button} onClick={handleAddSelectedItemToCart}>
              Add to Cart
            </button>
            <button style={styles.cancelButton} onClick={closeItemDetailModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Your Cart</h3>
            {cart.length === 0 ? (
              <p>No items in cart.</p>
            ) : (
              cart.map((c, index) => (
                <div key={index} style={styles.itemRow}>
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Submit Feedback</h3>
            <div style={styles.formGroup}>
              <label>Phone Number:</label>
              <input
                type="text"
                value={feedbackPhoneNumber}
                onChange={(e) => setFeedbackPhoneNumber(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Feedback:</label>
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                style={{ ...styles.input, height: "100px" }}
              />
            </div>
            {feedbackError && <p style={styles.errorText}>{feedbackError}</p>}
            {feedbackMessage && <p style={styles.successText}>{feedbackMessage}</p>}
            <button style={styles.button} onClick={handleSubmitFeedback}>
              Submit Feedback
            </button>
            <button style={styles.cancelButton} onClick={handleCloseFeedbackModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Update Profile</h3>
            {/* Display current username */}
            <p>Current Username: {username}</p>
            {/* Radio buttons to choose which field to update */}
            <div style={styles.formGroup}>
              <label>Select field to update:</label>
              <div>
                <label>
                  <input
                    type="radio"
                    value="username"
                    checked={profileOption === "username"}
                    onChange={(e) => setProfileOption(e.target.value)}
                  />
                  Username
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="email"
                    checked={profileOption === "email"}
                    onChange={(e) => setProfileOption(e.target.value)}
                  />
                  Email
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="password"
                    checked={profileOption === "password"}
                    onChange={(e) => setProfileOption(e.target.value)}
                  />
                  Password
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="phone"
                    checked={profileOption === "phone"}
                    onChange={(e) => setProfileOption(e.target.value)}
                  />
                  Phone Number
                </label>
              </div>
            </div>
            {/* Current password field is required for all updates except username */}
            {(profileOption === "email" || profileOption === "password" || profileOption === "phone") && (
              <div style={styles.formGroup}>
                <label>Current Password:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={styles.input}
                />
              </div>
            )}
            {/* Conditionally render input based on selected option */}
            {profileOption === "username" && (
              <div style={styles.formGroup}>
                <label>New Username:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={styles.input}
                  placeholder="Only letters"
                />
              </div>
            )}
            {profileOption === "email" && (
              <div style={styles.formGroup}>
                <label>New Email:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.input}
                  placeholder="example@domain.com"
                />
              </div>
            )}
            {profileOption === "password" && (
              <div style={styles.formGroup}>
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Alphanumeric, min 8 chars"
                />
              </div>
            )}
            {profileOption === "phone" && (
              <div style={styles.formGroup}>
                <label>New Phone Number:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={styles.input}
                  placeholder="10-digit number"
                />
              </div>
            )}
            {profileError && <p style={styles.errorText}>{profileError}</p>}
            {profileMessage && <p style={styles.successText}>{profileMessage}</p>}
            <button style={styles.button} onClick={handleSubmitProfile}>
              Submit Profile Update
            </button>
            <button style={styles.cancelButton} onClick={handleCloseProfileModal}>
              Cancel
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
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  profileButton: {
    padding: "4px 8px",
    backgroundColor: "#ffc107",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "black",
    fontSize: "14px",
  },
  feedbackButton: {
    padding: "8px 16px",
    backgroundColor: "#52c41a",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "white",
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
    textAlign: "left",
  },
  itemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },
  itemCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  itemImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    marginBottom: "8px",
    borderRadius: "4px",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "120px",
    backgroundColor: "#eee",
    borderRadius: "4px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
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
