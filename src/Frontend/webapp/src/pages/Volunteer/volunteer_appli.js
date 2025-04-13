import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VolunteerAppli = () => {
  const baseURL = process.env.REACT_APP_BASE_URL;

  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // error note
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');

  const validateFirstName = () => {
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = () => {
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameError('');
    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = () => {
    // Numbers, Spaces, +, -, and parentheses are allowed
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(phone) || phone.trim() === '') {
      setPhoneError('Invalid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Submit the form handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    //Authantication
    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPhoneValid) {
      return;
    }

    // Read the commit time in Unix time (seconds)
    const submissionTime = Math.floor(Date.now() / 1000);

    // Constructs the payload that is sent to the back end
    const payload = {
      firstName,
      lastName,
      email,
      phone,
      notes,
      submissionTime
    };

    try {
      const response = await axios.post(`${baseURL}/api/volunteer/apply`, payload);
      if (response.data.status === 'success') {
        setMessage('Application submitted successfully!');
        // clean form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setNotes('');
      } else {
        setMessage(response.data.message || 'Submission failed');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Submission failed');
    }
  };

  // Return to the previous page
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={styles.container}>
      {/* top nav bar */}
      <div style={styles.navbar}>
        <button style={styles.backButton} onClick={handleGoBack}>
          go back
        </button>
      </div>

      <div style={styles.content}>
        <h2>Volunteer Application</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={validateFirstName}
              style={styles.input}
              required
            />
            {firstNameError && <p style={styles.errorText}>{firstNameError}</p>}
          </div>
          <div style={styles.formGroup}>
            <label>Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={validateLastName}
              style={styles.input}
              required
            />
            {lastNameError && <p style={styles.errorText}>{lastNameError}</p>}
          </div>
          <div style={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validateEmail}
              style={styles.input}
              required
            />
            {emailError && <p style={styles.errorText}>{emailError}</p>}
          </div>
          <div style={styles.formGroup}>
            <label>Phone:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={validatePhone}
              style={styles.input}
              required
            />
            {phoneError && <p style={styles.errorText}>{phoneError}</p>}
          </div>
          <div style={styles.formGroup}>
            <label>Note:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="Enter additional information"
            />
          </div>
          <button type="submit" style={styles.button}>
            Submit Application
          </button>
          {message && <p style={styles.message}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#1890ff',
    padding: '10px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#faad14',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
  },
  content: {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  form: {
    marginTop: '20px',
    textAlign: 'left',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minHeight: '80px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
  },
  message: {
    marginTop: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
};

export default VolunteerAppli;
