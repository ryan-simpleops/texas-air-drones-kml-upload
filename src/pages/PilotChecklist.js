import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PilotChecklist.css';

// Equipment list from spreadsheet
const EQUIPMENT_ITEMS = [
  'Mission Plan',
  'Laptop',
  'Samsung SSD (Large Missions)',
  'SSD Microchip',
  'Starlink',
  'Jackery',
  'Emlid Base Station',
  'Emlid Rover',
  'Base Station Pole & Tripod',
  'Rover Pole & Bipod',
  'Landing Pad',
  'Cones',
  'Aerial Targets',
  'Matrice 4E',
  'Mavic 3M',
  'Matrice 350 RTK',
  'Battery Case (Matrice 350 Missions)',
  'Sensor (Matrice 350 Missions)',
  'Generator for Charging (Large Area Missions)',
  'Extension Cord',
  'Tool box with all contents'
];

// localStorage helpers
const STORAGE_KEY = 'pilot_checklist_';
const EXPIRY_DAYS = 7;

const saveToLocalStorage = (magicToken, data) => {
  const storageData = {
    data: data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  };
  localStorage.setItem(STORAGE_KEY + magicToken, JSON.stringify(storageData));
};

const loadFromLocalStorage = (magicToken) => {
  const stored = localStorage.getItem(STORAGE_KEY + magicToken);
  if (!stored) return null;

  const storageData = JSON.parse(stored);

  // Check if expired
  if (Date.now() > storageData.expiresAt) {
    localStorage.removeItem(STORAGE_KEY + magicToken);
    return null;
  }

  return storageData.data;
};

const clearLocalStorage = (magicToken) => {
  localStorage.removeItem(STORAGE_KEY + magicToken);
};

function PilotChecklist() {
  const [checklist, setChecklist] = useState({});
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);

  // Get magic_token from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('data') || '';

  // Validate magic token
  const validateMagicToken = (token) => {
    if (!token) return false;

    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length !== 2) return false;

      const orgId = parseInt(parts[0], 10);
      const dealId = parseInt(parts[1], 10);

      return !isNaN(orgId) && !isNaN(dealId) && orgId > 0 && dealId > 0;
    } catch (e) {
      return false;
    }
  };

  const isValidToken = magicToken && validateMagicToken(magicToken);

  // Fetch project data on mount
  useEffect(() => {
    if (!isValidToken) return;

    const fetchProjectData = async () => {
      try {
        const projectWebhookUrl = process.env.REACT_APP_PROJECT_WEBHOOK_URL;

        if (!projectWebhookUrl) return;

        const response = await fetch(`${projectWebhookUrl}?data=${magicToken}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Project data received:', data);
          if (data.project_name) {
            setProjectName(data.project_name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch project data:', err);
      }
    };

    fetchProjectData();
  }, [magicToken, isValidToken]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!isValidToken) return;

    const saved = loadFromLocalStorage(magicToken);
    if (saved) {
      setChecklist(saved.checklist || {});
      // Only use saved project name if we didn't fetch one from API
      if (!projectName && saved.projectName) {
        setProjectName(saved.projectName);
      }
      setDraftRestored(true);
      setTimeout(() => setDraftRestored(false), 5000);
    }
  }, [magicToken, isValidToken, projectName]);

  // Auto-save to localStorage on change
  useEffect(() => {
    if (isValidToken && (Object.keys(checklist).length > 0 || projectName)) {
      saveToLocalStorage(magicToken, { checklist, projectName });
    }
  }, [checklist, projectName, magicToken, isValidToken]);

  // Handle radio button change - only one column can be selected per item
  const handleCheck = (item, column) => {
    setChecklist(prev => ({
      ...prev,
      [item]: column // Store only the selected column name (pre, post, or na)
    }));
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    // Add logo (if available)
    const logo = new Image();
    logo.src = '/logo192.png';
    doc.addImage(logo, 'PNG', 10, 10, 30, 30);

    // Title
    doc.setFontSize(20);
    doc.text('Mapping Equipment Checklist', 50, 25);

    // Project info
    doc.setFontSize(12);
    doc.text(`Project Name: ${projectName || 'N/A'}`, 10, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 57);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 10, 64);

    // Checklist table
    const tableData = EQUIPMENT_ITEMS.map(item => [
      item,
      checklist[item] === 'pre' ? '✓' : '',
      checklist[item] === 'post' ? '✓' : '',
      checklist[item] === 'na' ? '✓' : ''
    ]);

    doc.autoTable({
      head: [['Equipment', 'Pre', 'Post', 'N/A']],
      body: tableData,
      startY: 72,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 77, 163], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text('Texas Air Drone - Equipment Checklist', 10, doc.internal.pageSize.height - 10);
    }

    return doc.output('blob');
  };

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const pdfBlob = generatePDF();

      const formData = new FormData();
      formData.append('file', pdfBlob, `equipment-checklist-${Date.now()}.pdf`);
      formData.append('magic_token', magicToken);
      formData.append('project_name', projectName);
      formData.append('checklist_data', JSON.stringify(checklist));

      const webhookUrl = process.env.REACT_APP_CHECKLIST_WEBHOOK_URL;

      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });

      setLoading(false);

      if (response.ok) {
        setSuccess(true);
        clearLocalStorage(magicToken);
        setChecklist({});
        setProjectName('');
      } else {
        setError('Submission failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
    }
  };

  // Handle clear draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear this draft? This cannot be undone.')) {
      clearLocalStorage(magicToken);
      setChecklist({});
      setProjectName('');
    }
  };

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

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>📋 Mapping Equipment Checklist</h1>
          <p>Texas Air Drone - Property Mapping</p>
        </div>

        <div className="content">
          {draftRestored && (
            <div className="info-message">
              <strong>ℹ️ Draft Restored:</strong> Your previous checklist has been restored.
            </div>
          )}

          <div className="section">
            <h2>Project Information</h2>
            <input
              type="text"
              className="project-name-input"
              placeholder="Loading project name..."
              value={projectName}
              readOnly
            />
          </div>

          <div className="section">
            <h2>Equipment Checklist</h2>
            <div className="checklist-table">
              <div className="checklist-header">
                <div className="col-equipment">Equipment</div>
                <div className="col-check">Pre</div>
                <div className="col-check">Post</div>
                <div className="col-check">N/A</div>
              </div>

              {EQUIPMENT_ITEMS.map((item, index) => (
                <div key={index} className="checklist-row">
                  <div className="col-equipment">{item}</div>
                  <div className="col-check">
                    <input
                      type="radio"
                      name={`equipment-${index}`}
                      checked={checklist[item] === 'pre'}
                      onChange={() => handleCheck(item, 'pre')}
                    />
                  </div>
                  <div className="col-check">
                    <input
                      type="radio"
                      name={`equipment-${index}`}
                      checked={checklist[item] === 'post'}
                      onChange={() => handleCheck(item, 'post')}
                    />
                  </div>
                  <div className="col-check">
                    <input
                      type="radio"
                      name={`equipment-${index}`}
                      checked={checklist[item] === 'na'}
                      onChange={() => handleCheck(item, 'na')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!success && (
            <div className="button-group">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                Submit Checklist
              </button>

              {Object.keys(checklist).length > 0 && (
                <button
                  className="clear-btn"
                  onClick={handleClearDraft}
                  disabled={loading}
                >
                  Clear Draft
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Submitting your checklist...</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <strong>✅ Success!</strong> Your equipment checklist has been submitted successfully.
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
  );
}

export default PilotChecklist;
