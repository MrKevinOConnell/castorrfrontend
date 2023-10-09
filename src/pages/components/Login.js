import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  createSignerRequest,
  getSignerRequest,
  createCastRequest,
} from './../../utils/normalUtils'; // Assuming the utilities are in a file named "utils.js" in the same directory

function Login({ parent }) {
  const [qrData, setQrData] = useState(null);
  const [farcasterUser, setFarcasterUser] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [showCastRequestForm, setShowCastRequestForm] = useState(false);
  const [castRequestDetails, setCastRequestDetails] = useState('');

  const handleCastRequestSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting cast request:', castRequestDetails);
    const farcasterInfo = JSON.parse(localStorage.getItem('farcaster_info'));
    let signer_uuid = farcasterInfo.signer_uuid;
    // Here you'd typically send the cast request to your server or handle it accordingly
    const cast = await createCastRequest({
      text: castRequestDetails,
      signer_uuid,
      parent,
    });
    console.log('cast:', cast);
    if (cast && cast.ok) {
      setShowCastRequestForm(false);
      setCastRequestDetails('');
    }
  };

  useEffect(() => {
    // When component mounts, get the signer data and set it for the QR code
    const createSigner = async () => {
      try {
        const farcasterInfo = JSON.parse(
          localStorage.getItem('farcaster_info')
        );
        if (
          farcasterInfo &&
          (farcasterInfo.signer_approval_url || farcasterInfo.isApproved)
        ) {
          console.log('farcasterInfo in login :', farcasterInfo);
          setIsApproved(farcasterInfo.isApproved);
          setQrData(farcasterInfo.signer_approval_url);
          setFarcasterUser(farcasterInfo.user);
          return;
        }
        const data = await createSignerRequest();
        console.log('data:', data);

        if (data && data.signer_uuid && data.signer_approval_url) {
          // Store signer_uuid in localStorage
          localStorage.setItem(
            'farcaster_info',
            JSON.stringify({
              signer_uuid: data.signer_uuid,
              isApproved: false,
              signer_approval_url: data.signer_approval_url,
            })
          );
        }
        setQrData(data.signer_approval_url);
      } catch (error) {
        console.error('Error creating signer:', error);
      }
    };

    createSigner();
  }, []);

  useEffect(() => {
    const farcasterInfo = JSON.parse(localStorage.getItem('farcaster_info'));
    console.log('info', farcasterInfo);
    if (!qrData || isApproved) return;
    // Polling logic to check if signer is approved
    const interval = setInterval(async () => {
      try {
        const farcasterInfo = JSON.parse(
          localStorage.getItem('farcaster_info')
        );

        if (!farcasterInfo) {
          console.error('No signer_uuid found in localStorage');
          return;
        }
        const data = await getSignerRequest(farcasterInfo.signer_uuid);
        console.log('"signer request:', data);
        if (data.status === 'approved') {
          setIsApproved(true);
          localStorage.setItem(
            'farcaster_info',
            JSON.stringify({
              signer_uuid: data.signer_uuid,
              isApproved: true,
              fid: data.fid,
              user: data.user,
            })
          );
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking signer status:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    }; // Clean up the interval on unmount
  }, [qrData, isApproved]);

  return (
    <div>
      {qrData && !isApproved ? (
        <div style={styles.centerContainer}>
          <p>Scan the QR code to approve:</p>
          <QRCode size={80} value={qrData} />
        </div>
      ) : isApproved ? (
        <div style={styles.profileContainer}>
          <div style={styles.userInfo}>
            <img
              src={farcasterUser.pfpURL}
              style={styles.profileImage}
              alt={`Profile of ${farcasterUser.username}`}
            />
            <p>You are signed in as @{farcasterUser.username}</p>
          </div>

          <div style={styles.formContainer}>
            <form onSubmit={handleCastRequestSubmit}>
              <textarea
                style={styles.textarea}
                value={castRequestDetails}
                onChange={(e) => setCastRequestDetails(e.target.value)}
                placeholder={`I love ${parent} so much because...`}
              />
              <button style={styles.button} type="submit">
                Cast
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p>Getting signer data...</p>
      )}
    </div>
  );
}

const styles = {
  profileContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    background: '#f7f8fa',
    borderRadius: '8px',
    maxHeight: '100px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
  },
  profileImage: {
    width: '50px',
    height: '50px',
    borderRadius: '25px',
    marginBottom: '8px',
  },
  formContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '10px',
    resize: 'vertical',
  },
  button: {
    width: '100%',
    padding: '8px 16px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

export default Login;
