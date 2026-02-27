import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [personData, setPersonData] = useState(null);

  // Get magic_token from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('data') || '';

  // Validate magic token
  const validateMagicToken = (token) => {
    if (!token) return false;

    try {
      // Decode base64
      const decoded = atob(token);

      // Check format: org_id:deal_id
      const parts = decoded.split(':');
      if (parts.length !== 2) return false;

      // Check both are numbers
      const orgId = parseInt(parts[0], 10);
      const dealId = parseInt(parts[1], 10);

      return !isNaN(orgId) && !isNaN(dealId) && orgId > 0 && dealId > 0;
    } catch (e) {
      return false;
    }
  };

  const isValidToken = magicToken && validateMagicToken(magicToken);

  // Fetch person data on mount (only if token is valid)
  useEffect(() => {
    if (!isValidToken) return;

    const fetchPersonData = async () => {
      try {
        const personWebhookUrl = process.env.REACT_APP_PERSON_WEBHOOK_URL;
        console.log('Person Webhook URL:', personWebhookUrl);
        console.log('Fetching person data with token:', magicToken);

        const response = await fetch(`${personWebhookUrl}?data=${magicToken}`);
        console.log('Person data response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Person data received:', data);
          setPersonData(data);
        } else {
          console.error('Person data fetch failed with status:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch person data:', err);
      }
    };

    fetchPersonData();
  }, [magicToken, isValidToken]);

  // Show 404 if no magic token or invalid format
  if (!isValidToken) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>404</h1>
            <p>Page not found</p>
          </div>
          <div className="content" style={{ textAlign: 'center' }}>
            <p>This page requires a valid access link.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFile = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['.kml', '.kmz'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      setError('Please upload a valid KML or KMZ file.');
      return;
    }

    setSelectedFile(file);
    setSuccess(false);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('filename', selectedFile.name);
    formData.append('mime_type', selectedFile.type || 'application/vnd.google-earth.kml+xml');
    formData.append('magic_token', magicToken);

    setLoading(true);
    setError('');

    try {
      const webhookUrl = process.env.REACT_APP_WEBHOOK_URL;
      console.log('Webhook URL:', webhookUrl);

      if (!webhookUrl) {
        console.error('Webhook URL not configured');
        throw new Error('Webhook URL not configured');
      }

      console.log('Uploading file:', selectedFile.name);
      console.log('Magic token:', magicToken);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      setLoading(false);

      if (response.ok) {
        console.log('Upload successful');
        setSuccess(true);
        setSelectedFile(null);
      } else {
        console.error('Upload failed with status:', response.status);
        setError('Upload failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>📍 Upload Your KML File</h1>
          {personData ? (
            <p>Hello {personData.first_name}, looking forward to working with {personData.company}!</p>
          ) : (
            <p>Texas Air Drone - Property Mapping</p>
          )}
        </div>

        <div className="content">
          <div className="section">
            <h2>📹 How to Create a KML File</h2>
            <div className="video-container">
              <video controls width="100%">
                <source src="/KML_Tutorial.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="section">
            <h2>📤 Upload Your KML File</h2>
            <div
              className={`upload-area ${dragOver ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <div className="upload-icon">☁️</div>
              <p><strong>Click to browse</strong> or drag and drop your file here</p>
              <p className="file-types">Accepts .kml and .kmz files</p>
            </div>
            <input
              type="file"
              id="fileInput"
              accept=".kml,.kmz"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <div className="file-info">
                <p><strong>Selected file:</strong> {selectedFile.name}</p>
              </div>
            )}

            {selectedFile && !success && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  Upload to Texas Air Drone
                </button>
              </div>
            )}

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Uploading your file...</p>
              </div>
            )}

            {success && (
              <div className="success-message">
                <strong>✅ Success!</strong> Your KML file has been uploaded successfully. We'll review your property and get back to you shortly.
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>❌ Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
