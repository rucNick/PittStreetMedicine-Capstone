import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // react-calendar
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../css/Volunteer/Volunteer_Dashboard.css'; 

const Volunteer_Dashboard = ({ userData }) => {
  const navigate = useNavigate();

  const [myUpcomingRounds, setMyUpcomingRounds] = useState([]);
  const [myPastRounds, setMyPastRounds] = useState([]);
  const [myRoundsError, setMyRoundsError] = useState('');

  const [allUpcomingRounds, setAllUpcomingRounds] = useState([]);
  const [allRoundsError, setAllRoundsError] = useState('');

  const [assignedOrders, setAssignedOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [roundsForSelectedDate, setRoundsForSelectedDate] = useState([]);

  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [fullViewModalOpen, setFullViewModalOpen] = useState(false);
  const [selectedRoundDetails, setSelectedRoundDetails] = useState(null);

  const loadMyRounds = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/rounds/my-rounds', {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      const data = response.data;
      if (data.status === 'success') {
        setMyUpcomingRounds(data.upcomingRounds || []);
        setMyPastRounds(data.pastRounds || []);
      } else {
        setMyRoundsError(data.message || 'Failed to load my rounds');
      }
    } catch (error) {
      setMyRoundsError(error.response?.data?.message || error.message);
    }
  }, [userData.userId]);

  const loadAllUpcomingRounds = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/rounds/all', {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      const data = response.data;
      if (data.status === 'success') {
        setAllUpcomingRounds(data.rounds || []);
      } else {
        setAllRoundsError(data.message || 'Failed to load upcoming rounds');
      }
    } catch (error) {
      setAllRoundsError(error.response?.data?.message || error.message);
    }
  }, [userData.userId]);

  const loadAssignedOrders = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/orders/all', {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      const data = response.data;
      setAssignedOrders(data.orders || []);
    } catch (error) {
      setOrdersError(error.response?.data?.message || error.message);
    }
  }, [userData.userId]);

  const signupForRound = async (roundId, requestedRole = 'VOLUNTEER') => {
    try {
      const response = await axios.post(`http://localhost:8080/api/rounds/${roundId}/signup`, {
        authenticated: true,
        userId: userData.userId,
        userRole: 'VOLUNTEER',
        requestedRole
      });
      alert(response.data.message);
      loadMyRounds();
      loadAllUpcomingRounds();
      handleDateClick(selectedDate);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const cancelSignup = async (signupId) => {
    try {
      const response = await axios.delete(`http://localhost:8080/api/rounds/signup/${signupId}`, {
        data: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      alert(response.data.message);
      // reload
      loadMyRounds();
      loadAllUpcomingRounds();
      handleDateClick(selectedDate);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // click calendar show rounds
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const filtered = allUpcomingRounds.filter((r) => {
      const roundDateStr = r.startTime.split('T')[0];
      return roundDateStr === dateStr;
    });
    setRoundsForSelectedDate(filtered);
    setShowRoundsModal(true);
  };

  // highlight days in calendar
  const highlightDates = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().split('T')[0];
    const found = allUpcomingRounds.some((r) => {
      const roundDateStr = r.startTime.split('T')[0];
      return roundDateStr === dateStr;
    });
    return found ? 'highlight-day' : null;
  };

  // ======= open "Full View" modal =======
  const openFullViewModal = async (roundId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/rounds/${roundId}`, {
        params: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      if (response.data.status === 'success') {
        setSelectedRoundDetails(response.data.round);
        setFullViewModalOpen(true);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const closeFullViewModal = () => {
    setFullViewModalOpen(false);
    setSelectedRoundDetails(null);
  };

  // ======= cancel sign up in full view =======
  const handleCancelSignupFullView = async () => {
    if (!selectedRoundDetails) return;
    const signupDetails = selectedRoundDetails.signupDetails;
    if (!signupDetails || !signupDetails.signupId) {
      alert("No signup found for this round");
      return;
    }
    const signupId = signupDetails.signupId;
    try {
      const response = await axios.delete(`http://localhost:8080/api/rounds/signup/${signupId}`, {
        data: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      alert(response.data.message);
      // close/refresh modal
      closeFullViewModal();
      loadMyRounds();
      loadAllUpcomingRounds();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // load data
  useEffect(() => {
    loadMyRounds();
    loadAllUpcomingRounds();
    loadAssignedOrders();
  }, [loadMyRounds, loadAllUpcomingRounds, loadAssignedOrders]);

  return (
    <div className="volunteer-dashboard-container">
      {/* go back button */}
      <div className="dashboard-header">
        <button className="back-btn" onClick={() => navigate("/")}>Back</button>
      </div>

      {/* left: rounds and orders */}
      <div className="volunteer-left-panel">
        <h2>My Upcoming Rounds</h2>
        {myRoundsError && <p className="error-text">{myRoundsError}</p>}
        <div className="rounds-cards">
          {myUpcomingRounds.length === 0 && <p>No upcoming rounds yet.</p>}
          {myUpcomingRounds.map((round) => (
            <div key={round.roundId} className="round-card">
              <h3>{round.title}</h3>
              <p>{round.description}</p>
              <p>Location: {round.location}</p>
              <p>Start: {new Date(round.startTime).toLocaleString()}</p>
              <p>End: {new Date(round.endTime).toLocaleString()}</p>
              {/* open full view modal */}
              <button className="open-view-btn" onClick={() => openFullViewModal(round.roundId)}>
                Open full view
              </button>
            </div>
          ))}
        </div>

        <h2>Assigned Orders</h2>
        {ordersError && <p className="error-text">{ordersError}</p>}
        <div className="orders-cards">
          {assignedOrders.map((order) => (
            <div key={order.orderId} className="order-card">
              <h3>{order.userName || 'Client Name'}</h3>
              <p>{order.deliveryAddress}</p>
              <p>Items: {order.orderItems?.map(i => i.itemName).join(', ')}</p>
              <button className="open-view-btn">Open full view</button>
            </div>
          ))}
        </div>
      </div>

      {/* calendar */}
      <div className="volunteer-right-panel">
        <h2>Select a date to see rounds</h2>
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={highlightDates}
        />

        {/* modal by click days in calendar*/}
        {showRoundsModal && (
          <div className="rounds-modal">
            <div className="rounds-modal-content">
              <h3>Rounds on {selectedDate.toDateString()}</h3>
              {roundsForSelectedDate.length === 0 && (
                <p>No rounds scheduled for this date.</p>
              )}
              {roundsForSelectedDate.map((round) => (
                <div key={round.roundId} className="round-detail">
                  <h4>{round.title}</h4>
                  <p>{round.description}</p>
                  <p>Location: {round.location}</p>
                  <p>Start: {new Date(round.startTime).toLocaleString()}</p>
                  <p>End: {new Date(round.endTime).toLocaleString()}</p>
                  <p>Available Slots: {round.availableSlots}</p>
                  <p>Already Signed Up? {round.userSignedUp ? 'Yes' : 'No'}</p>
                  {round.userSignedUp ? (
                    <p style={{ color: 'green' }}>You are already signed up.</p>
                  ) : round.openForSignup ? (
                    <button onClick={() => signupForRound(round.roundId, 'VOLUNTEER')}>
                      Sign Up
                    </button>
                  ) : (
                    <p style={{ color: 'red' }}>No slots available (waitlist not shown in this demo).</p>
                  )}
                </div>
              ))}
              <button className="close-modal-btn" onClick={() => setShowRoundsModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======= Full View modal ======= */}
      {fullViewModalOpen && selectedRoundDetails && (
        <div className="fullview-modal" onClick={closeFullViewModal}>
          <div className="fullview-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRoundDetails.title}</h2>
            <p><strong>Description:</strong> {selectedRoundDetails.description}</p>
            <p><strong>Location:</strong> {selectedRoundDetails.location}</p>
            <p><strong>Start:</strong> {new Date(selectedRoundDetails.startTime).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(selectedRoundDetails.endTime).toLocaleString()}</p>
            <p><strong>Available Slots:</strong> {selectedRoundDetails.availableSlots}</p>
            <p><strong>Already Signed Up?</strong> {selectedRoundDetails.userSignedUp ? 'Yes' : 'No'}</p>

            {/* sign up Cancel button */}
            {selectedRoundDetails.userSignedUp && selectedRoundDetails.signupDetails && (
              <button className="cancel-signup-btn" onClick={handleCancelSignupFullView}>
                Cancel Signup
              </button>
            )}

            <button className="close-modal-btn" onClick={closeFullViewModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Volunteer_Dashboard;
