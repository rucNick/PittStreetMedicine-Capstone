//=========================================== JS part ==============================================

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Guest.css";

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

  // ========== current order box ==========
  const [showCurrentOrderModal, setShowCurrentOrderModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ========== Logout ==========
  const handleLogout = () => {
    onLogout();
    navigate("/"); // back to login
  };

  // ========== cargo items ==========
  // New: We fetch cargo items from the backend and display them directly on the page
  const [showCargoItems, setShowCargoItems] = useState(false);
  const [cargoItems, setCargoItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // When user clicks "Make a New Order", fetch cargo items and show them
  const handleOpenNewOrder = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/cargo/items");
      setCargoItems(response.data);
      setShowCargoItems(true);
    } catch (error) {
      console.error("Failed to fetch cargo items:", error);
    }
  };

  // Clicking an item -> show detail modal
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
    const sizes = item.sizeQuantities ? Object.keys(item.sizeQuantities) : [];
    setSelectedSize(sizes.length > 0 ? sizes[0] : "");
    setSelectedQuantity(1);
  };

  // Close detail modal
  const closeItemDetailModal = () => {
    setSelectedItem(null);
    setShowItemDetailModal(false);
    setSelectedSize("");
    setSelectedQuantity(1);
  };

  // Add selected item to cart
  const handleAddSelectedItemToCart = () => {
    if (!selectedItem) return;
    if (selectedQuantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    // combine name + size
    const itemName = selectedSize
      ? `${selectedItem.name} (${selectedSize})`
      : selectedItem.name;
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

  // open/close cart
  const toggleCart = () => {
    setShowCart(!showCart);
    setCartError("");
    setCartMessage("");
  };

  // change quantities in cart
  const handleCartQuantityChange = (index, newQuantity) => {
    const updated = [...cart];
    updated[index].quantity = parseInt(newQuantity, 10) || 0;
    setCart(updated);
  };

  // remove item in cart
  const handleRemoveCartItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // ========== place order：POST /api/orders/guest/create with geolocation ==========
  // 1) get geolocation
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

  // 2) actual post to backend
  const placeOrderWithLocation = async (latitude, longitude) => {
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
      setCartError("Please fill in first name, last name, email, phone, and notes.");
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
        notes: combinedUserNotes,
        items: cart.map((c) => ({
          itemName: c.name,
          quantity: c.quantity,
        })),
      };
      if (latitude !== null && longitude !== null) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }
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
    <div className="container">
      {/* top nav bar */}
      <div className="navbar">
        <div className="navGreeting">Welcome, Guest!</div>
        <button className="logoutButton" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {/* Guest cannot view order history, only place an order */}
      <div className="content">
        <h2>Make a New Order as Guest</h2>
        <button className="newOrderButton" onClick={handleOpenNewOrder}>
          Make a New Order
        </button>
        <button className="cartButton" onClick={toggleCart}>
          Cart ({cart.length})
        </button>

        {/* If user has clicked "Make a New Order", show cargo items directly on page */}
        {showCargoItems && (
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
                        src={`http://localhost:8080/api/cargo/images/${item.id}`}
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

      {/* Detail modal for a selected item */}
      {showItemDetailModal && selectedItem && (
        <div className="modalOverlay">
          <div className="modalContent">
            {/* Show image or placeholder */}
            <div style={{ textAlign: "center" }}>
              {selectedItem.imageId ? (
                <img
                  src={`http://localhost:8080/api/cargo/images/${selectedItem.id}`}
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

            {/* If item has sizeQuantities, let user pick a size */}
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

            {/* quantity */}
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

            <button className="button" onClick={handleAddSelectedItemToCart}>
              Add to Cart
            </button>
            <button className="cancelButton" onClick={closeItemDetailModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* cart box open */}
      {showCart && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Your Cart</h3>
            {cart.length === 0 ? (
              <p>No items in cart.</p>
            ) : (
              cart.map((c, index) => (
                <div key={c.name} className="itemRow">
                  <span>{c.name}</span>
                  <input
                    type="number"
                    min="0"
                    value={c.quantity}
                    onChange={(e) => handleCartQuantityChange(index, e.target.value)}
                    style={{ width: "60px", marginLeft: "10px", marginRight: "10px" }}
                  />
                  <button
                    className="removeButton"
                    onClick={() => handleRemoveCartItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}

            {/* Required information: Address, firstName, lastName, email, phone, note */}
            <div className="formGroup">
              <label>Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>First Name:</label>
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Last Name:</label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Email:</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Phone:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Notes:</label>
              <input
                type="text"
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
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

      {/* Current order information popup (only displayed after successful order) */}
      {showCurrentOrderModal && currentOrder && (
        <div className="modalOverlay">
          <div className="modalContent">
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
            <button className="button" onClick={() => setShowCurrentOrderModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guest;
