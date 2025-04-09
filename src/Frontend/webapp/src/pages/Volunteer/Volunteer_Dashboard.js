import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // react-calendar
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../css/Volunteer/Volunteer_Dashboard.css'; 

const Volunteer_Dashboard = ({ userData }) => {
  const baseURL = process.env.REACT_APP_BASE_URL;

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
    if (!userData || !userData.userId) return;
    try {
      const response = await axios.get(`${baseURL}/api/rounds/my-rounds`, {
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
  }, [userData, baseURL]);

  const loadAllUpcomingRounds = useCallback(async () => {
    if (!userData || !userData.userId) return;
    try {
      const response = await axios.get(`${baseURL}/api/rounds/all`, {
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
  }, [userData, baseURL]);

  const loadAssignedOrders = useCallback(async () => {
    if (!userData || !userData.userId) return;
    try {
      const response = await axios.get(`${baseURL}/api/orders/all`, {
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
  }, [userData, baseURL]);

  const signupForRound = async (roundId, requestedRole = 'VOLUNTEER') => {
    try {
      const response = await axios.post(`${baseURL}/api/rounds/${roundId}/signup`, {
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

  // const cancelSignup = async (signupId) => {
  //   try {
  //     const response = await axios.delete(`${baseURL}/api/rounds/signup/${signupId}`, {
  //       data: {
  //         authenticated: true,
  //         userId: userData.userId,
  //         userRole: 'VOLUNTEER'
  //       }
  //     });
  //     alert(response.data.message);
  //     loadMyRounds();
  //     loadAllUpcomingRounds();
  //     handleDateClick(selectedDate);
  //   } catch (error) {
  //     alert(error.response?.data?.message || error.message);
  //   }
  // };

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

  const highlightDates = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().split('T')[0];
    const found = allUpcomingRounds.some((r) => {
      const roundDateStr = r.startTime.split('T')[0];
      return roundDateStr === dateStr;
    });
    return found ? 'highlight-day' : null;
  };

  const openFullViewModal = async (roundId) => {
    try {
      const response = await axios.get(`${baseURL}/api/rounds/${roundId}`, {
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

  const handleCancelSignupFullView = async () => {
    if (!selectedRoundDetails) return;
    const signupId = (selectedRoundDetails.signupDetails && selectedRoundDetails.signupDetails.signupId) || selectedRoundDetails.signupId;
    if (!signupId) {
      alert("No signup found for this round");
      return;
    }
    try {
      const response = await axios.delete(`${baseURL}/api/rounds/signup/${signupId}`, {
        data: {
          authenticated: true,
          userId: userData.userId,
          userRole: 'VOLUNTEER'
        }
      });
      alert(response.data.message);
      closeFullViewModal();
      loadMyRounds();
      loadAllUpcomingRounds();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (!userData || !userData.userId) return;
    loadMyRounds();
    loadAllUpcomingRounds();
    loadAssignedOrders();
  }, [loadMyRounds, loadAllUpcomingRounds, loadAssignedOrders, userData]);

  return (
    <div className="volunteer-dashboard-container">
      <div className="dashboard-header">
        <button className="back-btn" onClick={() => navigate("/")}>Back</button>
      </div>
      <div className="volunteer-left-panel">
        <h2>My Upcoming Rounds</h2>
        {myRoundsError && <p className="error-text">{myRoundsError}</p>}
        <div className="rounds-cards">
          {myUpcomingRounds.length === 0 && <p>No upcoming rounds yet.</p>}
          {myUpcomingRounds.map((round) => (
            <div
              key={round.roundId}
              className="round-card"
              style={{
                backgroundColor:
                  round.signupStatus === 'CONFIRMED'
                    ? 'lightgreen'
                    : round.signupStatus === 'WAITLISTED'
                    ? 'lightyellow'
                    : undefined
              }}
            >
              <h3>{round.title}</h3>
              <p>{round.description}</p>
              <p>Location: {round.location}</p>
              <p>Start: {new Date(round.startTime).toLocaleString()}</p>
              <p>End: {new Date(round.endTime).toLocaleString()}</p>
              <button className="open-view-btn" onClick={() => openFullViewModal(round.roundId)}>
                Open full view
              </button>
            </div>
          ))}
        </div>
{/* ---------------------------------------------------------------------------- */}
        <h2>My Past Rounds</h2>
        <div className="rounds-cards">
          {myPastRounds.length === 0 ? (
            <p>No past rounds available.</p>
          ) : (
            myPastRounds.map((round) => (
              <div key={round.roundId} className="round-card">
                <h3>{round.title}</h3>
                <p>{round.description}</p>
                <p>Location: {round.location}</p>
                <p>Start: {new Date(round.startTime).toLocaleString()}</p>
                <p>End: {new Date(round.endTime).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
{/* ---------------------------------------------------------------------------- */}
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
      <div className="volunteer-right-panel">
        <h2>Select a date to see rounds</h2>
        {/* ---------------------------------------------------------------------------- */}
        {allRoundsError && <p className="error-text">{allRoundsError}</p>}
        {/* ---------------------------------------------------------------------------- */}
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={highlightDates}
        />
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
            {selectedRoundDetails.userSignedUp && (selectedRoundDetails.signupDetails || selectedRoundDetails.signupId) && (
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
