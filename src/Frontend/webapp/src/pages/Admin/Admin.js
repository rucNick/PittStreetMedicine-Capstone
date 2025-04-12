import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = ({ onLogout, userData }) => {
  const baseURL = process.env.REACT_APP_BASE_URL;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  // ----- Users state & functions -----
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "CLIENT",
    firstName: "",
    lastName: ""
  });

  const [updateUserData, setUpdateUserData] = useState(null);
  const [updateSubroleUser, setUpdateSubroleUser] = useState(null);
  const [subroleSelection, setSubroleSelection] = useState("REGULAR");
  const [subroleNotes, setSubroleNotes] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/users`, {
        method: 'GET',
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      const data = response.data.data;
      const allUsers = [
        ...(data.clients || []),
        ...(data.volunteers || []),
        ...(data.admins || [])
      ];
      setUsers(allUsers);
    } catch (error) {
      setUsersError(error.response?.data?.message || error.message);
    }
  }, [userData.username, baseURL]);

  const deleteUser = async (usernameToDelete) => {
    try {
      const response = await axios.delete(`${baseURL}/api/admin/user/delete`, {
        data: {
          authenticated: "true",
          adminUsername: userData.username,
          username: usernameToDelete
        }
      });
      alert(response.data.message);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const addUser = async () => {
    try {
      const response = await axios.post(`${baseURL}/api/admin/user/create`, {
        adminUsername: userData.username,
        authenticated: "true",
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      });
      alert(response.data.message + "\nGenerated Password: " + response.data.generatedPassword);
      setNewUser({
        username: "",
        email: "",
        phone: "",
        role: "CLIENT",
        firstName: "",
        lastName: ""
      });
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const migratePasswords = async () => {
    try {
      const response = await axios.post(`${baseURL}/api/admin/migrate-passwords`, {}, {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const updateUser = async () => {
    try {
      const response = await axios.put(`${baseURL}/api/admin/user/update/${updateUserData.userId}`, {
        adminUsername: userData.username,
        authenticated: "true",
        username: updateUserData.username,
        email: updateUserData.email,
        phone: updateUserData.phone,
        role: updateUserData.role,
        firstName: updateUserData.firstName || "",
        lastName: updateUserData.lastName || ""
      });
      alert(response.data.message);
      setUpdateUserData(null);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const resetUserPassword = async (user) => {
    if (!user.userId) {
      alert("Cannot reset password: User ID is missing");
      return;
    }
    const newPassword = window.prompt("Enter new password for user " + user.username);
    if (!newPassword) return;
  
    try {
      const response = await axios.put(
        `${baseURL}/api/admin/user/reset-password/${user.userId}`,
        {
          adminUsername: userData.username,
          authenticated: "true",
          newPassword: newPassword
        }
      );
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };
  
  const handleOpenSubroleForm = (user) => {
    setUpdateSubroleUser(user);
    setSubroleSelection(user.volunteerSubRole || "REGULAR");
    setSubroleNotes("");
  };

  const handleCancelSubrole = () => {
    setUpdateSubroleUser(null);
    setSubroleSelection("REGULAR");
    setSubroleNotes("");
  };

  const handleSubmitSubrole = async () => {
    if (!updateSubroleUser || !updateSubroleUser.userId) {
      alert("User ID is missing");
      return;
    }
    try {
      const response = await axios.put(`${baseURL}/api/admin/volunteer/subrole`, {
        adminUsername: userData.username,
        authenticated: "true",
        userId: updateSubroleUser.userId.toString(),
        volunteerSubRole: subroleSelection,
        notes: subroleNotes
      });
      alert(response.data.message);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
    setUpdateSubroleUser(null);
    setSubroleSelection("REGULAR");
    setSubroleNotes("");
  };

  // ----- Orders, Applications, Feedback -----
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [orderFilter, setOrderFilter] = useState("PENDING");

  const loadOrders = useCallback(async (status) => {
    try {
      const response = await axios.get(`${baseURL}/api/orders/all`, {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: "VOLUNTEER"
        }
      });
      let fetchedOrders = response.data.orders || [];
      fetchedOrders = fetchedOrders.filter(order => order.status === status);
      setOrders(fetchedOrders);
    } catch (error) {
      setOrdersError(error.response?.data?.message || error.message);
    }
  }, [userData.userId, baseURL]);

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(`${baseURL}/api/orders/${orderId}/cancel`, {
        authenticated: true,
        userId: userData.userId,
        userRole: "VOLUNTEER"
      });
      alert(response.data.message);
      loadOrders(orderFilter);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const [applications, setApplications] = useState({ pending: [], approved: [], rejected: [] });
  const [applicationsError, setApplicationsError] = useState('');

  const loadApplications = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/api/volunteer/applications`, {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      setApplications(response.data.data);
    } catch (error) {
      setApplicationsError(error.response?.data?.message || error.message);
    }
  }, [userData.username, baseURL]);

  const approveApplication = async (applicationId) => {
    try {
      const response = await axios.post(`${baseURL}/api/volunteer/approve`, {
        adminUsername: userData.username,
        authenticated: "true",
        applicationId: applicationId.toString()
      });
      alert(response.data.message);
      loadApplications();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const rejectApplication = async (applicationId) => {
    try {
      const response = await axios.post(`${baseURL}/api/volunteer/reject`, {
        adminUsername: userData.username,
        authenticated: "true",
        applicationId: applicationId.toString()
      });
      alert(response.data.message);
      loadApplications();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackError, setFeedbackError] = useState('');

  const loadFeedback = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/api/feedback/all`, {
        headers: {
          "Admin-Username": userData.username,
          "Authentication-Status": "true"
        }
      });
      setFeedbacks(response.data.data);
    } catch (error) {
      setFeedbackError(error.response?.data?.message || error.message);
    }
  }, [userData.username, baseURL]);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "orders") {
      loadOrders(orderFilter);
    } else if (activeTab === "applications") {
      loadApplications();
    } else if (activeTab === "feedback") {
      loadFeedback();
    }
  }, [activeTab, orderFilter, loadUsers, loadOrders, loadApplications, loadFeedback]);

  // -------------- Logout --------------
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* Top Bar with Logout and Migrate Passwords */}
      <div style={styles.topBar}>
        <button style={styles.actionButton} onClick={migratePasswords}>
          Migrate Passwords
        </button>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        <h1>Admin Dashboard</h1>
        <p style={styles.welcomeText}>Welcome back, {userData.username}!</p>

        {/* Navigation Tabs */}
        <div style={styles.navbar}>
          <button onClick={() => setActiveTab("users")} style={styles.navButton}>
            Users
          </button>
          <button onClick={() => setActiveTab("orders")} style={styles.navButton}>
            Orders
          </button>
          <button onClick={() => setActiveTab("applications")} style={styles.navButton}>
            Volunteer Applications
          </button>
          <button onClick={() => setActiveTab("feedback")} style={styles.navButton}>
            Feedback
          </button>
          <button onClick={() => navigate('/cargo_admin')} style={styles.navButton}>
            Cargo Admin
          </button>
          <button onClick={() => navigate('/round_admin')} style={styles.navButton}>
            Rounds
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
                    <th style={styles.tableHeaderCell}>User ID</th>
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
                      <td style={styles.tableCell}>{user.userId || idx}</td>
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
                        <button
                          style={styles.actionButton}
                          onClick={() => setUpdateUserData(user)}
                        >
                          Update
                        </button>
                        <button
                          style={styles.actionButton}
                          onClick={() => resetUserPassword(user)}
                        >
                          Reset Password
                        </button>
                        {user.role === "VOLUNTEER" && (
                          <button
                            style={styles.actionButton}
                            onClick={() => handleOpenSubroleForm(user)}
                          >
                            Update Subrole
                          </button>
                        )}
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
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="First Name"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                style={styles.input}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={styles.select}
              >
                <option value="CLIENT">CLIENT</option>
                <option value="VOLUNTEER">VOLUNTEER</option>
              </select>
              <button style={styles.addButton} onClick={addUser}>Add User</button>
            </div>

            {/* Update User Form (Display only when the user is selected) */}
            {updateUserData && (
              <div style={styles.sectionContainer}>
                <h3>Update User: {updateUserData.username}</h3>
                <div style={styles.formContainer}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={updateUserData.username}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, username: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={updateUserData.email}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, email: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={updateUserData.phone}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, phone: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={updateUserData.firstName || ""}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, firstName: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={updateUserData.lastName || ""}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, lastName: e.target.value })
                    }
                    style={styles.input}
                  />
                  <select
                    value={updateUserData.role}
                    onChange={(e) =>
                      setUpdateUserData({ ...updateUserData, role: e.target.value })
                    }
                    style={styles.select}
                  >
                    <option value="CLIENT">CLIENT</option>
                    <option value="VOLUNTEER">VOLUNTEER</option>
                  </select>
                  <button style={styles.addButton} onClick={updateUser}>Submit Update</button>
                  <button style={styles.actionButton} onClick={() => setUpdateUserData(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {updateSubroleUser && (
              <div style={styles.sectionContainer}>
                <h3>Update Subrole for {updateSubroleUser.username}</h3>
                <div style={styles.formContainer}>
                  <select
                    value={subroleSelection}
                    onChange={(e) => setSubroleSelection(e.target.value)}
                    style={styles.select}
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="TEAM_LEAD">TEAM_LEAD</option>
                    <option value="CLINICIAN">CLINIC</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={subroleNotes}
                    onChange={(e) => setSubroleNotes(e.target.value)}
                    style={styles.input}
                  />
                  <button style={styles.addButton} onClick={handleSubmitSubrole}>
                    Submit Subrole Update
                  </button>
                  <button style={styles.actionButton} onClick={handleCancelSubrole}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
                  setOrderFilter("PENDING");
                  loadOrders("PENDING");
                }}
              >
                Pending Orders
              </button>
              <button
                style={styles.filterButton}
                onClick={() => {
                  setOrderFilter("CANCELLED");
                  loadOrders("CANCELLED");
                }}
              >
                Cancelled Orders
              </button>
              <button
                style={styles.filterButton}
                onClick={() => {
                  setOrderFilter("PROCESSING");
                  loadOrders("PROCESSING");
                }}
              >
                Processing Orders
              </button>
            </div>
            {ordersError && <p style={{ color: 'red' }}>Error: {ordersError}</p>}
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

        {/* ========================= FEEDBACK SECTION ========================= */}
        {activeTab === "feedback" && (
          <div style={styles.sectionContainer}>
            <h2>Feedback</h2>
            {feedbackError && <p style={{ color: 'red' }}>Error: {feedbackError}</p>}
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

// =========================================== CSS part ==============================================
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
    display: 'flex',
    gap: '10px'
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
