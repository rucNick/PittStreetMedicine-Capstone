//=========================================== JS part ==============================================

import React, { useState } from "react";
import axios from "axios";
import "./Home.css";

const Home = ({ username, email, password, phone, userId, onLogout }) => {
  console.log("Home component initialized", { username, email, phone, userId });

  // ============== Order History & UI States ==============
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  console.log("Order History & UI States initialized");

  // ============== Cart States ==============
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // If empty, will use registered phone
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  console.log("Cart States initialized");

  // ============== "Make a New Order" - Cargo Items ==============
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [cargoItems, setCargoItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  console.log("New Order and Cargo Items States initialized");

  // ============== Feedback States ==============
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackPhoneNumber, setFeedbackPhoneNumber] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  console.log("Feedback States initialized");

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
  console.log("Profile Update States initialized");

  // ================= Order History, Cancel Order, Fetch Cargo Items, etc. =================
  const toggleOrders = async () => {
    console.log("toggleOrders: called");
    if (!userId || typeof userId !== "number") {
      console.log("toggleOrders: Invalid userId, guest user detected");
      setOrdersError("Order history is not available for guest users.");
      setShowOrders(false);
      return;
    }

    if (!showOrders) {
      try {
        console.log("toggleOrders: Loading orders...");
        setOrdersLoading(true);
        setOrdersError("");
        const response = await axios.get(
          `http://localhost:8080/api/orders/user/${userId}`,
          { params: { authenticated: true, userRole: "CLIENT", userId } }
        );
        console.log("toggleOrders: Received response", response);
        if (response.data.status === "success") {
          const filtered = response.data.orders.filter((o) => o.status !== "CANCELLED");
          console.log("toggleOrders: Filtered orders", filtered);
          setOrders(filtered);
        } else {
          console.log("toggleOrders: Response indicates failure", response.data);
          setOrdersError(response.data.message || "Failed to load orders.");
        }
      } catch (error) {
        console.error("toggleOrders: Error occurred", error);
        setOrdersError(error.response?.data?.message || "Failed to load orders.");
      } finally {
        setOrdersLoading(false);
        console.log("toggleOrders: Loading complete");
      }
    }
    setShowOrders(!showOrders);
    console.log("toggleOrders: showOrders set to", !showOrders);
  };

  const handleCancelOrder = async (orderId) => {
    console.log("handleCancelOrder: called for orderId", orderId);
    try {
      const payload = { authenticated: true, userId, userRole: "CLIENT" };
      const response = await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        payload
      );
      console.log("handleCancelOrder: Received response", response);
      if (response.data.status === "success") {
        if (showOrders) {
          console.log("handleCancelOrder: Toggling orders to refresh list");
          await toggleOrders();
          await toggleOrders();
        }
      } else {
        alert(response.data.message || "Failed to cancel order.");
      }
    } catch (error) {
      console.error("handleCancelOrder: Error occurred", error);
      alert(error.response?.data?.message || "Failed to cancel order.");
    }
  };

  const fetchCargoItems = async () => {
    console.log("fetchCargoItems: Fetching cargo items");
    try {
      const response = await axios.get("http://localhost:8080/api/cargo/items");
      console.log("fetchCargoItems: Received response", response);
      setCargoItems(response.data);
    } catch (error) {
      console.error("Failed to fetch cargo items:", error);
    }
  };

  const handleOpenNewOrder = () => {
    console.log("handleOpenNewOrder: Opening new order");
    setShowNewOrder(true);
    fetchCargoItems();
  };

  const handleSelectItem = (item) => {
    console.log("handleSelectItem: Selected item", item);
    setSelectedItem(item);
    setShowItemDetailModal(true);
    const sizes = item.sizeQuantities ? Object.keys(item.sizeQuantities) : [];
    setSelectedSize(sizes.length > 0 ? sizes[0] : "");
    setSelectedQuantity(1);
    console.log("handleSelectItem: Set selectedSize and selectedQuantity");
  };

  const closeItemDetailModal = () => {
    console.log("closeItemDetailModal: Closing item detail modal");
    setShowItemDetailModal(false);
    setSelectedItem(null);
    setSelectedSize("");
    setSelectedQuantity(1);
  };

  const handleAddSelectedItemToCart = () => {
    console.log("handleAddSelectedItemToCart: called");
    if (!selectedItem) return;
    if (selectedQuantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    const itemName = selectedSize
      ? `${selectedItem.name} (${selectedSize})`
      : selectedItem.name;
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((c) => c.name === itemName);
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += selectedQuantity;
      console.log("handleAddSelectedItemToCart: Updated quantity for existing cart item");
    } else {
      newCart.push({ name: itemName, quantity: selectedQuantity });
      console.log("handleAddSelectedItemToCart: Added new item to cart");
    }
    setCart(newCart);
    closeItemDetailModal();
  };

  const toggleCart = () => {
    console.log("toggleCart: toggling cart visibility");
    setShowCart(!showCart);
    setCartError("");
    setCartMessage("");
  };

  const handleCartQuantityChange = (index, newQuantity) => {
    console.log("handleCartQuantityChange: index", index, "newQuantity", newQuantity);
    const updated = [...cart];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setCart(updated);
  };

  const handleRemoveCartItem = (index) => {
    console.log("handleRemoveCartItem: Removing cart item at index", index);
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const handlePlaceOrder = () => {
    console.log("handlePlaceOrder: called");
    if (navigator.geolocation) {
      console.log("handlePlaceOrder: Geolocation supported, fetching location");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("handlePlaceOrder: Received geolocation", position.coords);
          placeOrderWithLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {
          console.log("handlePlaceOrder: Geolocation error, proceeding without location");
          placeOrderWithLocation(null, null);
        }
      );
    } else {
      console.log("handlePlaceOrder: Geolocation not supported, proceeding without location");
      placeOrderWithLocation(null, null);
    }
  };

  const placeOrderWithLocation = async (latitude, longitude) => {
    console.log("placeOrderWithLocation: called with", { latitude, longitude });
    if (cart.length === 0) {
      console.log("placeOrderWithLocation: Cart is empty");
      setCartError("Your cart is empty.");
      return;
    }
    if (!deliveryAddress.trim() || !notes.trim() || !phoneNumber.trim()) {
      console.log("placeOrderWithLocation: Missing delivery address, notes or phone number");
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
      console.log("placeOrderWithLocation: Sending order payload", payload);
      const response = await axios.post("http://localhost:8080/api/orders/create", payload);
      console.log("placeOrderWithLocation: Received response", response);
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
        console.log("placeOrderWithLocation: Refreshing orders");
        await toggleOrders();
        await toggleOrders();
      }
    } catch (error) {
      console.error("placeOrderWithLocation: Error occurred", error);
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

  const handleOpenFeedbackModal = () => {
    console.log("handleOpenFeedbackModal: Opening feedback modal");
    setFeedbackContent("");
    setFeedbackPhoneNumber("");
    setFeedbackError("");
    setFeedbackMessage("");
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    console.log("handleCloseFeedbackModal: Closing feedback modal");
    setShowFeedbackModal(false);
  };

  const handleSubmitFeedback = async () => {
    console.log("handleSubmitFeedback: called");
    if (!feedbackContent.trim()) {
      console.log("handleSubmitFeedback: Feedback content empty");
      setFeedbackError("Feedback content cannot be empty.");
      return;
    }
    if (!feedbackPhoneNumber.trim()) {
      console.log("handleSubmitFeedback: Feedback phone number empty");
      setFeedbackError("Phone number is required.");
      return;
    }
    setFeedbackError("");
    try {
      const payload = {
        name: username,
        phoneNumber: feedbackPhoneNumber,
        content: feedbackContent,
      };
      console.log("handleSubmitFeedback: Sending payload", payload);
      const response = await axios.post("http://localhost:8080/api/feedback/submit", payload);
      console.log("handleSubmitFeedback: Received response", response);
      if (response.data.status === "success") {
        setFeedbackMessage("Feedback submitted successfully!");
        setTimeout(() => {
          console.log("handleSubmitFeedback: Closing feedback modal after submission");
          setShowFeedbackModal(false);
          setFeedbackContent("");
          setFeedbackPhoneNumber("");
          setFeedbackMessage("");
        }, 1500);
      } else {
        setFeedbackError(response.data.message || "Failed to submit feedback.");
      }
    } catch (error) {
      console.error("handleSubmitFeedback: Error occurred", error);
      setFeedbackError(error.response?.data?.message || "Failed to submit feedback.");
    }
  };

  // ------------- Profile Modal Operations -------------
  
  // Open profile modal and clear previous inputs
  const handleOpenProfileModal = () => {
    console.log("handleOpenProfileModal: Opening profile modal and clearing inputs");
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
    console.log("handleCloseProfileModal: Closing profile modal");
    setShowProfileModal(false);
  };

  // Handle submit of profile update based on selected option
  const handleSubmitProfile = async () => {
    console.log("handleSubmitProfile: called with profileOption", profileOption);
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
        console.log("handleSubmitProfile: Updating username");
        await axios.put("http://localhost:8080/api/auth/update/username", {
          userId,
          newUsername: newUsername.trim(),
          authenticated: "true",
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => {
          console.log("handleSubmitProfile: Logging out after username update");
          onLogout();
        }, 1500);
      } catch (error) {
        console.error("handleSubmitProfile: Error updating username", error);
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
        console.log("handleSubmitProfile: Updating email");
        await axios.put("http://localhost:8080/api/auth/update/email", {
          userId,
          currentPassword: currentPassword.trim(),
          newEmail: newEmail.trim(),
          authenticated: "true",
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => {
          console.log("handleSubmitProfile: Logging out after email update");
          onLogout();
        }, 1500);
      } catch (error) {
        console.error("handleSubmitProfile: Error updating email", error);
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
        console.log("handleSubmitProfile: Updating password");
        await axios.put("http://localhost:8080/api/auth/update/password", {
          userId,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          authenticated: "true",
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => {
          console.log("handleSubmitProfile: Logging out after password update");
          onLogout();
        }, 1500);
      } catch (error) {
        console.error("handleSubmitProfile: Error updating password", error);
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
        console.log("handleSubmitProfile: Updating phone number");
        await axios.put("http://localhost:8080/api/auth/update/phone", {
          userId,
          currentPassword: currentPassword.trim(),
          newPhone: newPhone.trim(),
          authenticated: "true",
        });
        setProfileMessage("You have successfully updated your information. Please log out to update your information.");
        setTimeout(() => {
          console.log("handleSubmitProfile: Logging out after phone update");
          onLogout();
        }, 1500);
      } catch (error) {
        console.error("handleSubmitProfile: Error updating phone number", error);
        setProfileError(error.response?.data?.message || "Failed to update phone number.");
      }
    }
  };

  // ================= Rendering Section =================
  console.log("Home: Rendering component");
  return (
    <div className="container">
      {/* Navbar */}
      <div className="navbar">
        <div className="navGreeting">
          {/* Display current username and Profile button */}
          Hello, {username}!
          <button className="profileButton" onClick={handleOpenProfileModal}>
            Profile
          </button>
        </div>
        <button className="feedbackButton" onClick={handleOpenFeedbackModal}>
          Feedback
        </button>
        <button className="cartButton" onClick={toggleCart}>
          Cart
        </button>
        <button className="logoutButton" onClick={onLogout}>
          Log Out
        </button>
      </div>

      {/* Main Content */}
      <div className="content">
        <h2>Welcome Back, {username}!</h2>
        <div className="buttonRow">
          <button className="toggleOrdersButton" onClick={toggleOrders}>
            View Orders History
          </button>
          <button className="newOrderButton" onClick={handleOpenNewOrder}>
            Make a New Order
          </button>
        </div>
        {ordersLoading && <p>Loading orders...</p>}
        {ordersError && <p className="errorText">{ordersError}</p>}
        {showOrders && !ordersLoading && (
          <div className="ordersList">
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              orders.map((order, idx) => (
                <div key={idx} className="orderItem">
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
                    className="deleteButton"
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
            <div className="itemGrid">
              {cargoItems.length === 0 ? (
                <p>No items found in cargo.</p>
              ) : (
                cargoItems.map((item) => (
                  <div
                    key={item.id}
                    className="itemCard"
                    onClick={() => handleSelectItem(item)}
                  >
                    {item.imageId ? (
                      <img
                        src={`http://localhost:8080/api/cargo/images/${item.imageId}`}
                        alt={item.name}
                        className="itemImage"
                      />
                    ) : (
                      <div className="itemImagePlaceholder">
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
        <div className="modalOverlay">
          <div className="modalContent">
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
                    onChange={(e) => {
                      console.log("Item Detail Modal: selectedSize changed to", e.target.value);
                      setSelectedSize(e.target.value);
                    }}
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
                onChange={(e) => {
                  console.log("Item Detail Modal: selectedQuantity changed to", e.target.value);
                  setSelectedQuantity(Number(e.target.value));
                }}
                style={{ width: "60px" }}
              />
            </div>
            <button className="button" onClick={handleAddSelectedItemToCart}>
              Add to Cart
            </button>
            <button className="cancelButton" onClick={closeItemDetailModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Your Cart</h3>
            {cart.length === 0 ? (
              <p>No items in cart.</p>
            ) : (
              cart.map((c, index) => (
                <div key={index} className="itemRow">
                  <span>{c.name}</span>
                  <input
                    type="number"
                    min="0"
                    value={c.quantity}
                    onChange={(e) => {
                      console.log("Cart Modal: Quantity changed for item at index", index, "to", e.target.value);
                      handleCartQuantityChange(index, e.target.value);
                    }}
                    style={{ width: "60px", marginLeft: "10px", marginRight: "10px" }}
                  />
                  <button
                    className="removeButton"
                    onClick={() => {
                      console.log("Cart Modal: Removing item at index", index);
                      handleRemoveCartItem(index);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <div className="formGroup">
              <label>Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  console.log("Cart Modal: Delivery Address changed to", e.target.value);
                  setDeliveryAddress(e.target.value);
                }}
                className="input"
              />
            </div>
            <div className="formGroup">
              <label>Phone Number:</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  console.log("Cart Modal: Phone Number changed to", e.target.value);
                  setPhoneNumber(e.target.value);
                }}
                className="input"
              />
            </div>
            <div className="formGroup">
              <label>Notes:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => {
                  console.log("Cart Modal: Notes changed to", e.target.value);
                  setNotes(e.target.value);
                }}
                className="input"
              />
            </div>
            {cartError && <p className="errorText">{cartError}</p>}
            {cartMessage && <p className="successText">{cartMessage}</p>}
            <button className="button" onClick={handlePlaceOrder}>
              Place Order
            </button>
            <button className="cancelButton" onClick={toggleCart}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Submit Feedback</h3>
            <div className="formGroup">
              <label>Phone Number:</label>
              <input
                type="text"
                value={feedbackPhoneNumber}
                onChange={(e) => {
                  console.log("Feedback Modal: Phone Number changed to", e.target.value);
                  setFeedbackPhoneNumber(e.target.value);
                }}
                className="input"
              />
            </div>
            <div className="formGroup">
              <label>Feedback:</label>
              <textarea
                value={feedbackContent}
                onChange={(e) => {
                  console.log("Feedback Modal: Feedback content changed");
                  setFeedbackContent(e.target.value);
                }}
                className="input textareaInput"
              />
            </div>
            {feedbackError && <p className="errorText">{feedbackError}</p>}
            {feedbackMessage && <p className="successText">{feedbackMessage}</p>}
            <button className="button" onClick={handleSubmitFeedback}>
              Submit Feedback
            </button>
            <button className="cancelButton" onClick={handleCloseFeedbackModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Update Profile</h3>
            {/* Display current username */}
            <p>Current Username: {username}</p>
            {/* Radio buttons to choose which field to update */}
            <div className="formGroup">
              <label>Select field to update:</label>
              <div>
                <label>
                  <input
                    type="radio"
                    value="username"
                    checked={profileOption === "username"}
                    onChange={(e) => {
                      console.log("Profile Modal: profileOption changed to", e.target.value);
                      setProfileOption(e.target.value);
                    }}
                  />
                  Username
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="email"
                    checked={profileOption === "email"}
                    onChange={(e) => {
                      console.log("Profile Modal: profileOption changed to", e.target.value);
                      setProfileOption(e.target.value);
                    }}
                  />
                  Email
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="password"
                    checked={profileOption === "password"}
                    onChange={(e) => {
                      console.log("Profile Modal: profileOption changed to", e.target.value);
                      setProfileOption(e.target.value);
                    }}
                  />
                  Password
                </label>
                <label style={{ marginLeft: "10px" }}>
                  <input
                    type="radio"
                    value="phone"
                    checked={profileOption === "phone"}
                    onChange={(e) => {
                      console.log("Profile Modal: profileOption changed to", e.target.value);
                      setProfileOption(e.target.value);
                    }}
                  />
                  Phone Number
                </label>
              </div>
            </div>
            {/* Current password field is required for all updates except username */}
            {(profileOption === "email" || profileOption === "password" || profileOption === "phone") && (
              <div className="formGroup">
                <label>Current Password:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    console.log("Profile Modal: Current Password changed");
                    setCurrentPassword(e.target.value);
                  }}
                  className="input"
                />
              </div>
            )}
            {/* Conditionally render input based on selected option */}
            {profileOption === "username" && (
              <div className="formGroup">
                <label>New Username:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    console.log("Profile Modal: New Username changed to", e.target.value);
                    setNewUsername(e.target.value);
                  }}
                  className="input"
                  placeholder="Only letters"
                />
              </div>
            )}
            {profileOption === "email" && (
              <div className="formGroup">
                <label>New Email:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    console.log("Profile Modal: New Email changed to", e.target.value);
                    setNewEmail(e.target.value);
                  }}
                  className="input"
                  placeholder="example@domain.com"
                />
              </div>
            )}
            {profileOption === "password" && (
              <div className="formGroup">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    console.log("Profile Modal: New Password changed");
                    setNewPassword(e.target.value);
                  }}
                  className="input"
                  placeholder="Alphanumeric, min 8 chars"
                />
              </div>
            )}
            {profileOption === "phone" && (
              <div className="formGroup">
                <label>New Phone Number:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => {
                    console.log("Profile Modal: New Phone Number changed to", e.target.value);
                    setNewPhone(e.target.value);
                  }}
                  className="input"
                  placeholder="10-digit number"
                />
              </div>
            )}
            {profileError && <p className="errorText">{profileError}</p>}
            {profileMessage && <p className="successText">{profileMessage}</p>}
            <button className="button" onClick={handleSubmitProfile}>
              Submit Profile Update
            </button>
            <button className="cancelButton" onClick={handleCloseProfileModal}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
