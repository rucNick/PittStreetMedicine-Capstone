import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../css/Round/Round_Admin.css';

function Round_Admin() {
  const navigate = useNavigate();
  const userData = JSON.parse(sessionStorage.getItem("auth_user")) || {};

  const [activeTab, setActiveTab] = useState("viewRounds");
  const [rounds, setRounds] = useState([]);
  const [roundFilter, setRoundFilter] = useState("all");
  const [newRound, setNewRound] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    maxParticipants: "",
    teamLeadId: "",
    clinicianId: ""
  });
  const [message, setMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  // modalTab: "details" | "lottery" | "signups"
  const [modalTab, setModalTab] = useState("details");
  const [modalLotteryResult, setModalLotteryResult] = useState("");
  const [modalRoundDetails, setModalRoundDetails] = useState(null);

  const [updateRoundStep, setUpdateRoundStep] = useState("inputId");
  const [roundIdToUpdate, setRoundIdToUpdate] = useState("");
  const [updateRoundData, setUpdateRoundData] = useState(null);

  const formatDatetimeLocal = (dt) => {
    if (!dt) return "";
    return new Date(dt).toISOString().slice(0,16);
  };

  // 1. view rounds
  const fetchRounds = async () => {
    try {
      const url = roundFilter === "all" ? "/api/admin/rounds/all" : "/api/admin/rounds/upcoming";
      const response = await axios.get(url, {
        params: {
          authenticated: true,
          adminUsername: userData.username
        }
      });
      if (response.data.status === "success") {
        setRounds(response.data.rounds);
        setMessage("");
      } else {
        setMessage(response.data.message || "Error fetching rounds");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  // 2. create rounds
  const createRound = async () => {
    try {
      const payload = {
        authenticated: true,
        adminUsername: userData.username,
        title: newRound.title,
        description: newRound.description,
        startTime: newRound.startTime,
        endTime: newRound.endTime,
        location: newRound.location,
        maxParticipants: parseInt(newRound.maxParticipants, 10)
      };
      if (newRound.teamLeadId.trim() !== "") {
        const tid = parseInt(newRound.teamLeadId, 10);
        if (!isNaN(tid)) payload.teamLeadId = tid;
      }
      if (newRound.clinicianId.trim() !== "") {
        const cid = parseInt(newRound.clinicianId, 10);
        if (!isNaN(cid)) payload.clinicianId = cid;
      }

      const response = await axios.post("/api/admin/rounds/create", payload);
      if (response.data.status === "success") {
        setMessage("Round created with ID: " + response.data.roundId);
      } else {
        setMessage(response.data.message || "Error creating round");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  // 3. cancel rounds
  const cancelRoundById = async (roundId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.put(`/api/admin/rounds/${roundId}/cancel`, {
        authenticated: true,
        adminUsername: userData.username
      });
      if (response.data.status === "success") {
        setMessage("Round cancelled successfully with ID: " + response.data.roundId);
        fetchRounds();
      } else {
        setMessage(response.data.message || "Error cancelling round");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  // 4. modal(lottory, detail, manage signup)

  const openModal = (round) => {
    setSelectedRound(round);
    setModalOpen(true);
    setModalTab("details");
    setModalLotteryResult("");
    setModalRoundDetails(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRound(null);
    setModalTab("details");
  };

  // run lottery（in modal）
  const runLotteryForModal = async () => {
    try {
      const response = await axios.post(`/api/admin/rounds/${selectedRound.roundId}/lottery`, {
        authenticated: true,
        adminUsername: userData.username
      });
      if (response.data.status === "success") {
        setModalLotteryResult("Lottery run successfully. Selected volunteers: " + response.data.selectedVolunteers);
      } else {
        setModalLotteryResult(response.data.message || "Error running lottery");
      }
    } catch (error) {
      console.error(error);
      setModalLotteryResult(error.response?.data?.message || error.message);
    }
  };

  // detail(in modal）
  const fetchModalSignups = async () => {
    try {
      const response = await axios.get(`/api/admin/rounds/${selectedRound.roundId}`, {
        params: {
          authenticated: true,
          adminUsername: userData.username
        }
      });
      if (response.data.status === "success") {
        setModalRoundDetails(response.data);
      } else {
        setMessage(response.data.message || "Error fetching round details");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  // approve/reject signups（in modal）
  const confirmSignup = async (signupId) => {
    try {
      const response = await axios.put(`/api/admin/rounds/signup/${signupId}/confirm`, {
        authenticated: true,
        adminUsername: userData.username,
        adminId: userData.userId
      });
      if (response.data.status === "success") {
        setMessage("Signup confirmed: " + signupId);
        fetchModalSignups();
      } else {
        setMessage(response.data.message || "Error confirming signup");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  const rejectSignup = async (signupId) => {
    try {
      const response = await axios.request({
        method: 'delete',
        url: `/api/admin/rounds/signup/${signupId}`,
        data: {
          authenticated: true,
          adminUsername: userData.username,
          adminId: userData.userId
        }
      });
      if (response.data.status === "success") {
        setMessage("Signup rejected: " + signupId);
        fetchModalSignups();
      } else {
        setMessage(response.data.message || "Error rejecting signup");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  const fetchRoundForUpdate = async () => {
    try {
      const response = await axios.get(`/api/admin/rounds/${roundIdToUpdate}`, {
        params: {
          authenticated: true,
          adminUsername: userData.username
        }
      });
      if (response.data.status === "success") {
        const round = response.data.round;
        round.startTime = formatDatetimeLocal(round.startTime);
        round.endTime = formatDatetimeLocal(round.endTime);
        setUpdateRoundData(round);
        setUpdateRoundStep("editForm");
        setMessage("");
      } else {
        setMessage(response.data.message || "Error fetching round");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  const updateRound = async () => {
    try {
      const payload = {
        authenticated: true,
        adminUsername: userData.username,
        title: updateRoundData.title,
        description: updateRoundData.description,
        startTime: updateRoundData.startTime,
        endTime: updateRoundData.endTime,
        location: updateRoundData.location,
        maxParticipants: parseInt(updateRoundData.maxParticipants, 10),
        status: updateRoundData.status
      };
      const response = await axios.put(`/api/admin/rounds/${updateRoundData.roundId}`, payload);
      if (response.data.status === "success") {
        setMessage("Round updated successfully with ID: " + response.data.roundId);
      } else {
        setMessage(response.data.message || "Error updating round");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="container">
      <h1>Rounds Administration</h1>
      <div className="navbar">
        <button className="navButton" onClick={() => { setActiveTab("viewRounds"); fetchRounds(); }}>View Rounds</button>
        <button className="navButton" onClick={() => setActiveTab("createRound")}>Create Round</button>
        <button className="navButton" onClick={() => { setActiveTab("updateRound"); setUpdateRoundStep("inputId"); setRoundIdToUpdate(""); setUpdateRoundData(null); }}>Update Rounds</button>
        <button className="navButton" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="content">
        {activeTab === "viewRounds" && (
          <div>
            <h2>View Rounds</h2>
            <div className="button-group">
              <button className="action-button" onClick={() => { setRoundFilter("all"); fetchRounds(); }}>All Rounds</button>
              <button className="action-button" onClick={() => { setRoundFilter("upcoming"); fetchRounds(); }}>Upcoming Rounds</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header-cell">Round ID</th>
                  <th className="table-header-cell">Title</th>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">Start Time</th>
                  <th className="table-header-cell">End Time</th>
                  <th className="table-header-cell">Location</th>
                  <th className="table-header-cell">Max</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round, idx) => (
                  <tr key={idx} onClick={() => openModal(round)}>
                    <td className="table-cell">{round.roundId}</td>
                    <td className="table-cell">{round.title}</td>
                    <td className="table-cell">{round.description}</td>
                    <td className="table-cell">{new Date(round.startTime).toLocaleString()}</td>
                    <td className="table-cell">{new Date(round.endTime).toLocaleString()}</td>
                    <td className="table-cell">{round.location}</td>
                    <td className="table-cell">{round.maxParticipants}</td>
                    <td className="table-cell">{round.status}</td>
                    <td className="table-cell">
                      <button className="action-button" onClick={(e) => cancelRoundById(round.roundId, e)}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "createRound" && (
          <div>
            <h2>Create Round</h2>
            <div className="form-container">
              <input className="input" type="text" placeholder="Title" value={newRound.title} onChange={(e) => setNewRound({ ...newRound, title: e.target.value })} />
              <input className="input" type="text" placeholder="Description" value={newRound.description} onChange={(e) => setNewRound({ ...newRound, description: e.target.value })} />
              <input className="input" type="datetime-local" placeholder="Start Time" value={newRound.startTime} onChange={(e) => setNewRound({ ...newRound, startTime: e.target.value })} />
              <input className="input" type="datetime-local" placeholder="End Time" value={newRound.endTime} onChange={(e) => setNewRound({ ...newRound, endTime: e.target.value })} />
              <input className="input" type="text" placeholder="Location" value={newRound.location} onChange={(e) => setNewRound({ ...newRound, location: e.target.value })} />
              <input className="input" type="text" placeholder="Max Participants" value={newRound.maxParticipants} onChange={(e) => setNewRound({ ...newRound, maxParticipants: e.target.value })} />
              <input className="input" type="text" placeholder="Team Lead ID (optional)" value={newRound.teamLeadId} onChange={(e) => setNewRound({ ...newRound, teamLeadId: e.target.value })} />
              <input className="input" type="text" placeholder="Clinician ID (optional)" value={newRound.clinicianId} onChange={(e) => setNewRound({ ...newRound, clinicianId: e.target.value })} />
              <button className="action-button" onClick={createRound}>Create Round</button>
            </div>
          </div>
        )}

        {activeTab === "updateRound" && (
          <div>
            <h2>Update Round</h2>
            {updateRoundStep === "inputId" && (
              <div className="form-container">
                <input className="input" type="text" placeholder="Enter Round ID" value={roundIdToUpdate} onChange={(e) => setRoundIdToUpdate(e.target.value)} />
                <button className="action-button" onClick={fetchRoundForUpdate}>Next</button>
              </div>
            )}
            {updateRoundStep === "editForm" && updateRoundData && (
              <div className="form-container">
                <input className="input" type="text" placeholder="Title" value={updateRoundData.title} onChange={(e) => setUpdateRoundData({ ...updateRoundData, title: e.target.value })} />
                <input className="input" type="text" placeholder="Description" value={updateRoundData.description} onChange={(e) => setUpdateRoundData({ ...updateRoundData, description: e.target.value })} />
                <input className="input" type="datetime-local" placeholder="Start Time" value={updateRoundData.startTime} onChange={(e) => setUpdateRoundData({ ...updateRoundData, startTime: e.target.value })} />
                <input className="input" type="datetime-local" placeholder="End Time" value={updateRoundData.endTime} onChange={(e) => setUpdateRoundData({ ...updateRoundData, endTime: e.target.value })} />
                <input className="input" type="text" placeholder="Location" value={updateRoundData.location} onChange={(e) => setUpdateRoundData({ ...updateRoundData, location: e.target.value })} />
                <input className="input" type="text" placeholder="Max Participants" value={updateRoundData.maxParticipants} onChange={(e) => setUpdateRoundData({ ...updateRoundData, maxParticipants: e.target.value })} />
                <input className="input" type="text" placeholder="Status" value={updateRoundData.status || ""} onChange={(e) => setUpdateRoundData({ ...updateRoundData, status: e.target.value })} />
                <button className="action-button" onClick={updateRound}>Update Round</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* modal */}
      {modalOpen && selectedRound && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Round Detail - {selectedRound.title}</h2>
              <button className="modal-close-button" onClick={closeModal}>X</button>
            </div>
            <div className="modal-nav">
              <button className={`modal-nav-button ${modalTab === "details" ? "active" : ""}`} onClick={() => setModalTab("details")}>
                Details
              </button>
              <button className={`modal-nav-button ${modalTab === "lottery" ? "active" : ""}`} onClick={() => setModalTab("lottery")}>
                Run Lottery
              </button>
              <button className={`modal-nav-button ${modalTab === "signups" ? "active" : ""}`} onClick={() => {
                setModalTab("signups");
                fetchModalSignups();
              }}>
                Manage Signups
              </button>
            </div>
            <div className="modal-content">
              {modalTab === "details" && (
                <div>
                  <p><strong>ID:</strong> {selectedRound.roundId}</p>
                  <p><strong>Title:</strong> {selectedRound.title}</p>
                  <p><strong>Description:</strong> {selectedRound.description}</p>
                  <p><strong>Start Time:</strong> {new Date(selectedRound.startTime).toLocaleString()}</p>
                  <p><strong>End Time:</strong> {new Date(selectedRound.endTime).toLocaleString()}</p>
                  <p><strong>Location:</strong> {selectedRound.location}</p>
                  <p><strong>Max Participants:</strong> {selectedRound.maxParticipants}</p>
                  <p><strong>Status:</strong> {selectedRound.status}</p>
                </div>
              )}
              {modalTab === "lottery" && (
                <div>
                  <button className="action-button" onClick={runLotteryForModal}>Run Lottery</button>
                  {modalLotteryResult && <p className="message">{modalLotteryResult}</p>}
                </div>
              )}
              {modalTab === "signups" && (
                <div>
                  {modalRoundDetails && modalRoundDetails.signups && modalRoundDetails.signups.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="table-header-cell">Signup ID</th>
                          <th className="table-header-cell">Volunteer Info</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalRoundDetails.signups.map((signup, idx) => (
                          <tr key={idx}>
                            <td className="table-cell">{signup.signupId}</td>
                            <td className="table-cell">
                              {signup.firstName
                                ? signup.firstName + (signup.lastName ? ' ' + signup.lastName : '')
                                : (signup.username || 'N/A')
                              }
                            </td>
                            <td className="table-cell">{signup.status}</td>
                            <td className="table-cell">
                              <button className="action-button" onClick={() => confirmSignup(signup.signupId)}>Confirm</button>
                              <button className="action-button" onClick={() => rejectSignup(signup.signupId)}>Reject</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No signups available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Round_Admin;
