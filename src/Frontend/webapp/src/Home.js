//=========================================== JS part ==============================================
import React, { useState } from "react";
import axios from "axios";
import "./Home.css";

//import { encrypt, decrypt, getSessionId, isInitialized } from "./security/ecdhClient";

import { useNavigate } from "react-router-dom"; // for pages jump

//const Home = ({ username, email, password, phone, userId, onLogout }) => {
const Home = ({ username, email, phone, userId, onLogout }) => {
  console.log("Home component initialized", { username, email, phone, userId });

  // ============== Cart States ==============
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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

  // ============== Customize Item Related State ==============
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState(1);

  // Initialize navigate hook for page navigation (Profile, Feedback, Order History)
  const navigate = useNavigate();

  // ================= Other functions (Cart, New Order, etc.) =================

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

  // === Opens the custom item popup window ===
  const handleOpenCustomItemModal = () => {
    setShowCustomItemModal(true);
  };

  // === Add custom items to cart ===
  const handleAddCustomItemToCart = () => {
    if (!customItemName.trim()) {
      alert("Please enter an item name.");
      return;
    }
    const quantity = parseInt(customItemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity (positive integer).");
      return;
    }
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((c) => c.name === customItemName.trim());
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({ name: customItemName.trim(), quantity });
    }
    setCart(newCart);
    setShowCustomItemModal(false);
    setCustomItemName("");
    setCustomItemQuantity(1);
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
    } catch (error) {
      console.error("placeOrderWithLocation: Error occurred", error);
      setCartError(error.response?.data?.message || "Order creation failed.");
    }
  };

  // Modified: Remove orders history logic from Home.
  // Instead, when "View Orders History" is clicked, navigate to the separate Order History page.
  const handleOrderHistoryNavigation = () => {
    navigate("/orderhistory");
  };





  // ================================== Rendering Section =================
  console.log("Home: Rendering component");
  return (
    <div className="container">
      {/* Navbar */}
      <div className="navbar">
        <div className="navGreeting">
          Hello, {username}!
          {/* Profile button navigates to Profile page */}
          <button className="profileButton" onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>
        {/* Feedback button navigates to Feedback page */}
        <button className="feedbackButton" onClick={() => navigate("/feedback")}>
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
          {/* Modified: "View Orders History" button navigates to separate Order History page */}
          <button className="toggleOrdersButton" onClick={handleOrderHistoryNavigation}>
            View Orders History
          </button>
          <button className="newOrderButton" onClick={handleOpenNewOrder}>
            Make a New Order
          </button>
        </div>

        {/* Available Items */}
        {showNewOrder && (
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3>Available Items</h3>
              <div
                style={{ color: "#1890ff", cursor: "pointer", marginLeft: "10px" }}
                onClick={handleOpenCustomItemModal}
              >
                Didn't find items you want? Click here.
              </div>
            </div>
            <div className="itemGrid" style={{ marginTop: "10px" }}>
              {cargoItems.length === 0 ? (
                <p>No items found in cargo.</p>
              ) : (
                cargoItems.map((item) => (
                  <div key={item.id} className="itemCard" onClick={() => handleSelectItem(item)}>
                    {item.imageId ? (
                      <img
                        src={`http://localhost:8080/api/cargo/images/${item.imageId}`}
                        alt={item.name}
                        className="itemImage"
                      />
                    ) : (
                      <div className="itemImagePlaceholder">No Image</div>
                    )}
                    <h4>{item.name}</h4>
                    <p style={{ fontSize: "14px", color: "#999" }}>{item.category}</p>
                    <p style={{ fontSize: "14px" }}>Total Stock: {item.quantity}</p>
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
                    {Object.entries(selectedItem.sizeQuantities).map(([size, qty]) => (
                      <option key={size} value={size}>
                        {size} (stock: {qty})
                      </option>
                    ))}
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

      {/* Custom Item Popup */}
      {showCustomItemModal && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Add a custom item</h3>
            <div className="formGroup">
              <label>Item Name:</label>
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="input"
              />
            </div>
            <div className="formGroup">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                value={customItemQuantity}
                onChange={(e) => setCustomItemQuantity(e.target.value)}
                className="input"
              />
            </div>
            <button className="button" onClick={handleAddCustomItemToCart}>
              Add to Cart
            </button>
            <button className="cancelButton" onClick={() => setShowCustomItemModal(false)}>
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
    </div>
  );
};

export default Home;