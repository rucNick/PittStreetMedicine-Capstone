import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = ({ onLogout, userData }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users"); // "users", "orders", "applications", or "feedback"
  console.log("Component Admin: Initialized with activeTab =", "users");

  // ----- Users state & functions -----
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  // For adding a new user
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "CLIENT"
  });
  console.log("State: Initialized users, usersError, and newUser");

  // Fetch all users from the backend
  const loadUsers = useCallback(async () => {
    console.log("loadUsers: Start loading users");
    try {
      const response = await axios.get('http://localhost:8080/api/auth/users', {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      console.log("loadUsers: Received response", response);
      const data = response.data.data;
      const allUsers = [
        ...(data.clients || []),
        ...(data.volunteers || []),
        ...(data.admins || [])
      ];
      console.log("loadUsers: Combined allUsers =", allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.log("loadUsers: Error occurred", error);
      setUsersError(error.response?.data?.message || error.message);
    }
  }, [userData.username]);

  // Delete user by username
  const deleteUser = async (usernameToDelete) => {
    console.log("deleteUser: Deleting user", usernameToDelete);
    try {
      const response = await axios.delete('http://localhost:8080/api/auth/delete', {
        data: {
          authenticated: "true",
          adminUsername: userData.username,
          username: usernameToDelete
        }
      });
      console.log("deleteUser: Received response", response);
      alert(response.data.message);
      loadUsers();
    } catch (error) {
      console.log("deleteUser: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // Add new user
  const addUser = async () => {
    console.log("addUser: Adding new user", newUser);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', newUser);
      console.log("addUser: Received response", response);
      alert(response.data.message);
      loadUsers();
    } catch (error) {
      console.log("addUser: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // ----- Orders state & functions -----
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [orderFilter, setOrderFilter] = useState("PENDING"); // "PENDING", "CANCELLED", "PROCESSING"
  console.log("State: Initialized orders, ordersError, and orderFilter =", orderFilter);

  // Fetch orders from the backend (we pass userRole="VOLUNTEER" to allow viewing all orders)
  const loadOrders = useCallback(async (status) => {
    console.log("loadOrders: Loading orders with status", status);
    try {
      const response = await axios.get('http://localhost:8080/api/orders/all', {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: "VOLUNTEER"
        }
      });
      console.log("loadOrders: Received response", response);
      let fetchedOrders = response.data.orders || [];
      fetchedOrders = fetchedOrders.filter(order => order.status === status);
      console.log("loadOrders: Filtered orders =", fetchedOrders);
      setOrders(fetchedOrders);
    } catch (error) {
      console.log("loadOrders: Error occurred", error);
      setOrdersError(error.response?.data?.message || error.message);
    }
  }, [userData.userId]);

  // Cancel (delete) an order
  const cancelOrder = async (orderId) => {
    console.log("cancelOrder: Cancelling order with orderId", orderId);
    try {
      const response = await axios.post(`http://localhost:8080/api/orders/${orderId}/cancel`, {
        authenticated: true,
        userId: userData.userId,
        userRole: "VOLUNTEER"
      });
      console.log("cancelOrder: Received response", response);
      alert(response.data.message);
      // Reload orders to refresh table
      console.log("cancelOrder: Reloading orders with current filter", orderFilter);
      loadOrders(orderFilter);
    } catch (error) {
      console.log("cancelOrder: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // ----- Volunteer Applications state & functions -----
  const [applications, setApplications] = useState({ pending: [], approved: [], rejected: [] });
  const [applicationsError, setApplicationsError] = useState('');
  console.log("State: Initialized applications and applicationsError");

  const loadApplications = useCallback(async () => {
    console.log("loadApplications: Loading volunteer applications");
    try {
      const response = await axios.get('http://localhost:8080/api/volunteer/applications', {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      console.log("loadApplications: Received response", response);
      setApplications(response.data.data);
    } catch (error) {
      console.log("loadApplications: Error occurred", error);
      setApplicationsError(error.response?.data?.message || error.message);
    }
  }, [userData.username]);

  const approveApplication = async (applicationId) => {
    console.log("approveApplication: Approving application with ID", applicationId);
    try {
      const response = await axios.post('http://localhost:8080/api/volunteer/approve', {
        adminUsername: userData.username,
        authenticated: "true",
        applicationId: applicationId.toString()
      });
      console.log("approveApplication: Received response", response);
      alert(response.data.message);
      loadApplications();
    } catch (error) {
      console.log("approveApplication: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  const rejectApplication = async (applicationId) => {
    console.log("rejectApplication: Rejecting application with ID", applicationId);
    try {
      const response = await axios.post('http://localhost:8080/api/volunteer/reject', {
        adminUsername: userData.username,
        authenticated: "true",
        applicationId: applicationId.toString()
      });
      console.log("rejectApplication: Received response", response);
      alert(response.data.message);
      loadApplications();
    } catch (error) {
      console.log("rejectApplication: Error occurred", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  // ----- Feedback state & functions -----
  const [feedbacks, setFeedbacks] = useState([]); // Store all feedback data
  const [feedbackError, setFeedbackError] = useState(''); // Store any error related to feedback

  // Load all feedback from the backend
  const loadFeedback = useCallback(async () => {
    console.log("loadFeedback: Loading all feedback");
    try {
      const response = await axios.get('http://localhost:8080/api/feedback/all', {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      console.log("loadFeedback: Received response", response);
      setFeedbacks(response.data.data);
    } catch (error) {
      console.log("loadFeedback: Error occurred", error);
      setFeedbackError(error.response?.data?.message || error.message);
    }
  }, [userData.username]);

  // Load data when switching tabs
  useEffect(() => {
    console.log("useEffect: Active tab changed to", activeTab);
    if (activeTab === "users") {
      console.log("useEffect: Loading users tab");
      loadUsers();
    } else if (activeTab === "orders") {
      console.log("useEffect: Loading orders tab with filter", orderFilter);
      loadOrders(orderFilter);
    } else if (activeTab === "applications") {
      console.log("useEffect: Loading applications tab");
      loadApplications();
    }
    // When activeTab is "feedback", call loadFeedback()
    else if (activeTab === "feedback") {
      console.log("useEffect: Loading feedback tab");
      loadFeedback();
    }
  }, [activeTab, orderFilter, loadUsers, loadOrders, loadApplications, loadFeedback]);

  // Logout
  const handleLogout = () => {
    console.log("handleLogout: Logging out");
    onLogout();
    navigate('/');
  };

  // =========================================== HTML part ==============================================

  return (
    <div style={styles.container}>
      {/* Top Bar with Logout Button */}
      <div style={styles.topBar}>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        <h1>Admin Dashboard</h1>
        <p style={styles.welcomeText}>Welcome back, {userData.username}!</p>

        {/* Navigation Tabs */}
        <div style={styles.navbar}>
          <button onClick={() => { console.log("Navigation: Switching to users tab"); setActiveTab("users") }} style={styles.navButton}>
            Users
          </button>
          <button onClick={() => { console.log("Navigation: Switching to orders tab"); setActiveTab("orders") }} style={styles.navButton}>
            Orders
          </button>
          <button onClick={() => { console.log("Navigation: Switching to applications tab"); setActiveTab("applications") }} style={styles.navButton}>
            Volunteer Applications
          </button>
          {/* New "Feedback" button to show feedback data */}
          <button onClick={() => { console.log("Navigation: Switching to feedback tab"); setActiveTab("feedback") }} style={styles.navButton}>
            Feedback
          </button>
          <button onClick={() => { console.log("Navigation: Navigating to Cargo Admin page"); navigate('/cargo_admin'); }} style={styles.navButton}>
            Cargo Admin
          </button>
        </div>

        {/* ========================= USERS SECTION ========================= */}
        {activeTab === "users" && (
          <div style={styles.sectionContainer}>
            <h2>All Users</h2>
            {usersError && <p style={{ color: 'red' }}>Error: {usersError}</p>}

            {/* Users Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Username</th>
                    <th style={styles.tableHeaderCell}>Email</th>
                    <th style={styles.tableHeaderCell}>Role</th>
                    <th style={styles.tableHeaderCell}>Phone</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={idx}>
                      <td style={styles.tableCell}>{user.username}</td>
                      <td style={styles.tableCell}>{user.email}</td>
                      <td style={styles.tableCell}>{user.role}</td>
                      <td style={styles.tableCell}>{user.phone}</td>
                      <td style={styles.tableCell}>
                        <button
                          style={styles.actionButton}
                          onClick={() => deleteUser(user.username)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New User Form */}
            <h3>Add New User</h3>
            <div style={styles.formContainer}>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => {
                  console.log("New User Form: Username changed to", e.target.value);
                  setNewUser({ ...newUser, username: e.target.value });
                }}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => {
                  console.log("New User Form: Email changed to", e.target.value);
                  setNewUser({ ...newUser, email: e.target.value });
                }}
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => {
                  console.log("New User Form: Password changed");
                  setNewUser({ ...newUser, password: e.target.value });
                }}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) => {
                  console.log("New User Form: Phone changed to", e.target.value);
                  setNewUser({ ...newUser, phone: e.target.value });
                }}
                style={styles.input}
              />
              <select
                value={newUser.role}
                onChange={(e) => {
                  console.log("New User Form: Role changed to", e.target.value);
                  setNewUser({ ...newUser, role: e.target.value });
                }}
                style={styles.select}
              >
                <option value="CLIENT">CLIENT</option>
                
              </select>
              <button style={styles.addButton} onClick={addUser}>Add User</button>
            </div>
          </div>
        )}

        {/* ========================= ORDERS SECTION ========================= */}
        {activeTab === "orders" && (
          <div style={styles.sectionContainer}>
            <h2>Orders</h2>
            <div style={styles.buttonGroup}>
              <button
                style={styles.filterButton}
                onClick={() => {
                  console.log("Filter: Pending Orders selected");
                  setOrderFilter("PENDING");
                  loadOrders("PENDING");
                }}
              >
                Pending Orders
              </button>
              <button
                style={styles.filterButton}
                onClick={() => {
                  console.log("Filter: Cancelled Orders selected");
                  setOrderFilter("CANCELLED");
                  loadOrders("CANCELLED");
                }}
              >
                Cancelled Orders
              </button>
              {/* Added: Button to view orders with PROCESSING status */}
              <button
                style={styles.filterButton}
                onClick={() => {
                  console.log("Filter: Processing Orders selected");
                  setOrderFilter("PROCESSING");
                  loadOrders("PROCESSING");
                }}
              >
                Processing Orders
              </button>
            </div>
            {ordersError && <p style={{ color: 'red' }}>Error: {ordersError}</p>}

            {/* Orders Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Order ID</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Item Name</th>
                    <th style={styles.tableHeaderCell}>Quantity</th>
                    <th style={styles.tableHeaderCell}>Order Time</th>
                    <th style={styles.tableHeaderCell}>User ID</th>
                    <th style={styles.tableHeaderCell}>Delivery Address</th>
                    <th style={styles.tableHeaderCell}>Phone Number</th>
                    <th style={styles.tableHeaderCell}>Note</th>
                    <th style={styles.tableHeaderCell}>Order Type</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order =>
                    order.orderItems.map((item, idx) => (
                      <tr key={`${order.orderId}-${idx}`}>
                        <td style={styles.tableCell}>{order.orderId}</td>
                        <td style={styles.tableCell}>{order.status}</td>
                        <td style={styles.tableCell}>{item.itemName}</td>
                        <td style={styles.tableCell}>{item.quantity}</td>
                        <td style={styles.tableCell}>
                          {new Date(order.requestTime).toLocaleString()}
                        </td>
                        <td style={styles.tableCell}>{order.userId}</td>
                        <td style={styles.tableCell}>{order.deliveryAddress}</td>
                        <td style={styles.tableCell}>{order.phoneNumber}</td>
                        <td style={styles.tableCell}>{order.notes}</td>
                        <td style={styles.tableCell}>{order.orderType}</td>
                        <td style={styles.tableCell}>
                          {/* Allow cancel only when order status is PENDING or PROCESSING */}
                          {(order.status === "PENDING" || order.status === "PROCESSING") && (
                            <button
                              style={styles.actionButton}
                              onClick={() => cancelOrder(order.orderId)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================= VOLUNTEER APPLICATIONS SECTION ========================= */}
        {activeTab === "applications" && (
          <div style={styles.sectionContainer}>
            <h2>Volunteer Applications</h2>
            {applicationsError && <p style={{ color: 'red' }}>Error: {applicationsError}</p>}

            {/* Pending Applications */}
            <div style={styles.tableContainer}>
              <h3 style={styles.tableHeader}>Pending Applications</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Application ID</th>
                    <th style={styles.tableHeaderCell}>Name</th>
                    <th style={styles.tableHeaderCell}>Email</th>
                    <th style={styles.tableHeaderCell}>Phone</th>
                    <th style={styles.tableHeaderCell}>Notes</th>
                    <th style={styles.tableHeaderCell}>Submission Date</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.pending.map((app, idx) => (
                    <tr key={idx}>
                      <td style={styles.tableCell}>{app.applicationId}</td>
                      <td style={styles.tableCell}>{app.firstName} {app.lastName}</td>
                      <td style={styles.tableCell}>{app.email}</td>
                      <td style={styles.tableCell}>{app.phone}</td>
                      <td style={styles.tableCell}>{app.notes}</td>
                      <td style={styles.tableCell}>
                        {new Date(app.submissionDate).toLocaleString()}
                      </td>
                      <td style={styles.tableCell}>
                        <button
                          style={styles.actionButton}
                          onClick={() => approveApplication(app.applicationId)}
                        >
                          Approve
                        </button>
                        <button
                          style={styles.actionButton}
                          onClick={() => rejectApplication(app.applicationId)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approved Applications */}
            <div style={styles.tableContainer}>
              <h3 style={styles.tableHeader}>Approved Applications</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Application ID</th>
                    <th style={styles.tableHeaderCell}>Name</th>
                    <th style={styles.tableHeaderCell}>Email</th>
                    <th style={styles.tableHeaderCell}>Phone</th>
                    <th style={styles.tableHeaderCell}>Notes</th>
                    <th style={styles.tableHeaderCell}>Submission Date</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.approved.map((app, idx) => (
                    <tr key={idx}>
                      <td style={styles.tableCell}>{app.applicationId}</td>
                      <td style={styles.tableCell}>{app.firstName} {app.lastName}</td>
                      <td style={styles.tableCell}>{app.email}</td>
                      <td style={styles.tableCell}>{app.phone}</td>
                      <td style={styles.tableCell}>{app.notes}</td>
                      <td style={styles.tableCell}>
                        {new Date(app.submissionDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rejected Applications */}
            <div style={styles.tableContainer}>
              <h3 style={styles.tableHeader}>Rejected Applications</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Application ID</th>
                    <th style={styles.tableHeaderCell}>Name</th>
                    <th style={styles.tableHeaderCell}>Email</th>
                    <th style={styles.tableHeaderCell}>Phone</th>
                    <th style={styles.tableHeaderCell}>Notes</th>
                    <th style={styles.tableHeaderCell}>Submission Date</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.rejected.map((app, idx) => (
                    <tr key={idx}>
                      <td style={styles.tableCell}>{app.applicationId}</td>
                      <td style={styles.tableCell}>{app.firstName} {app.lastName}</td>
                      <td style={styles.tableCell}>{app.email}</td>
                      <td style={styles.tableCell}>{app.phone}</td>
                      <td style={styles.tableCell}>{app.notes}</td>
                      <td style={styles.tableCell}>
                        {new Date(app.submissionDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================= FEEDBACK SECTION (New) ========================= */}
        {activeTab === "feedback" && (
          <div style={styles.sectionContainer}>
            <h2>Feedback</h2>
            {feedbackError && <p style={{ color: 'red' }}>Error: {feedbackError}</p>}

            {/* Table to display all feedback records */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>ID</th>
                    <th style={styles.tableHeaderCell}>Name</th>
                    <th style={styles.tableHeaderCell}>Phone</th>
                    <th style={styles.tableHeaderCell}>Content</th>
                    <th style={styles.tableHeaderCell}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr key={f.id}>
                      <td style={styles.tableCell}>{f.id}</td>
                      <td style={styles.tableCell}>{f.name}</td>
                      <td style={styles.tableCell}>{f.phoneNumber}</td>
                      <td style={styles.tableCell}>{f.content}</td>
                      <td style={styles.tableCell}>{f.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

//=========================================== CSS part ==============================================
const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
  },
  topBar: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  navbar: {
    marginTop: '60px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  navButton: {
    margin: '0 10px',
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    textAlign: 'center',
    width: '90%',
    margin: '0 auto',
  },
  welcomeText: {
    fontSize: '18px',
    marginBottom: '30px',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    marginBottom: '40px',
  },
  tableContainer: {
    marginTop: '20px',
    overflowX: 'auto',
  },
  tableHeader: {
    textAlign: 'left',
    marginBottom: '10px',
    marginTop: '30px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #ccc',
  },
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
  actionButton: {
    margin: '0 5px',
    padding: '6px 10px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  filterButton: {
    margin: '0 10px',
    padding: '10px 20px',
    backgroundColor: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonGroup: {
    marginBottom: '20px',
  },
  formContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  select: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Admin;
