import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './MissionPlan.css';
import { MISSION_PLAN_FIELDS } from '../config/missionPlanFields';

// localStorage helpers
const STORAGE_KEY = 'mission_plan_';
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

function MissionPlan() {
  const [formData, setFormData] = useState({});
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [apiPopulatedFields, setApiPopulatedFields] = useState([]);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Get magic_token from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('data') || '';

  // Validate magic token
  const validateMagicToken = (token) => {
    if (!token) return false;

    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length !== 3) return false;

      const contactId = parseInt(parts[0], 10);
      const dealId = parseInt(parts[1], 10);
      const pilotId = parseInt(parts[2], 10);

      return !isNaN(contactId) && !isNaN(dealId) && !isNaN(pilotId) &&
             contactId > 0 && dealId > 0 && pilotId > 0;
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
        const projectWebhookUrl = process.env.REACT_APP_PROJECT_WEBHOOK_URL || 'https://texairdrone.app.n8n.cloud/webhook/83270d03-929b-4a8a-96ce-5633da50f182';

        const response = await fetch(`${projectWebhookUrl}?data=${magicToken}`);

        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            console.log('Project data received:', data);

            // Pre-populate customer info fields if available
            const customerData = {};
            const populatedFields = [];

            if (data.project) {
              customerData.projectName = data.project;
              populatedFields.push('projectName');
            }
            if (data.address) {
              customerData.address = data.address;
              populatedFields.push('address');
            }
            if (data.contact) {
              customerData.pointOfContact = data.contact;
              populatedFields.push('pointOfContact');
            }
            if (data.phone) {
              customerData.phone = data.phone;
              populatedFields.push('phone');
            }

            setFormData(prev => ({ ...prev, ...customerData }));
            setApiPopulatedFields(populatedFields);
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
      setFormData(saved.formData || {});
      if (saved.signature) {
        setSignature(saved.signature);
        // Restore signature on canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = saved.signature;
        }
      }
      setDraftRestored(true);
      setTimeout(() => setDraftRestored(false), 5000);
    }
  }, [magicToken, isValidToken]);

  // Auto-save to localStorage on change
  useEffect(() => {
    if (isValidToken && (Object.keys(formData).length > 0 || signature)) {
      saveToLocalStorage(magicToken, { formData, signature });
    }
  }, [formData, signature, magicToken, isValidToken]);

  // Handle input change
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Signature drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      setSignature(canvas.toDataURL());
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
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
    doc.text('Mission Plan - Controller Settings', 50, 25);

    // Date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 50);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 10, 57);

    let yPos = 67;

    // Customer Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CUSTOMER INFORMATION', 10, yPos);
    yPos += 7;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    MISSION_PLAN_FIELDS.customerInfo.forEach(field => {
      const value = formData[field.name] || 'N/A';
      doc.text(`${field.label}: ${value}`, 10, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Controller Settings
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CONTROLLER SETTINGS', 10, yPos);
    yPos += 7;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    MISSION_PLAN_FIELDS.controllerSettings.forEach(field => {
      const value = formData[field.name] || 'N/A';
      doc.text(`${field.label}: ${value}`, 10, yPos);
      yPos += 6;

      // Add new page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    yPos += 5;

    // Advanced Settings
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('ADVANCED SETTINGS', 10, yPos);
    yPos += 7;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    MISSION_PLAN_FIELDS.advancedSettings.forEach(field => {
      const value = formData[field.name] || 'N/A';
      doc.text(`${field.label}: ${value}`, 10, yPos);
      yPos += 6;

      // Add new page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Add signature if available
    if (signature) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFontSize(12);
      doc.text('Pilot Signature:', 10, yPos);
      doc.addImage(signature, 'PNG', 10, yPos + 5, 60, 20);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text('Texas Air Drone - Mission Plan', 10, doc.internal.pageSize.height - 10);
    }

    return doc.output('blob');
  };

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const pdfBlob = generatePDF();

      const formDataObj = new FormData();
      formDataObj.append('file', pdfBlob, `mission-plan-${Date.now()}.pdf`);
      formDataObj.append('data', magicToken);

      const webhookUrl = process.env.REACT_APP_CHECKLIST_WEBHOOK_URL || 'https://texairdrone.app.n8n.cloud/webhook/2753c6c8-d766-4f86-9534-c65edbdf7db2';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formDataObj
      });

      setLoading(false);

      if (response.ok) {
        setSuccess(true);
        clearLocalStorage(magicToken);
        setFormData({});
        clearSignature();
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
      setFormData({});
      clearSignature();
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
          <h1>✈️ Mission Plan - Controller Settings</h1>
          <p>Texas Air Drone - Property Mapping</p>
        </div>

        <div className="content">
          {draftRestored && (
            <div className="info-message">
              <strong>ℹ️ Draft Restored:</strong> Your previous mission plan has been restored.
            </div>
          )}

          {/* Customer Information Section */}
          <div className="section">
            <h2>Customer Information</h2>
            {MISSION_PLAN_FIELDS.customerInfo.map((field) => {
              // Project name is always read-only
              // Other fields are read-only only if populated from API
              const isReadOnly = field.name === 'projectName' || apiPopulatedFields.includes(field.name);

              return (
                <div key={field.name} className="form-field">
                  <label>{field.label}{field.required && ' *'}</label>
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    required={field.required}
                    readOnly={isReadOnly}
                    className={isReadOnly ? 'read-only' : ''}
                    placeholder={isReadOnly ? '' : `Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Controller Settings Section */}
          <div className="section">
            <h2>Controller Settings</h2>
            {MISSION_PLAN_FIELDS.controllerSettings.map((field) => (
              <div key={field.name} className="form-field">
                <label>{field.label}{field.required && ' *'}</label>
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                >
                  <option value="">-- Select --</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Advanced Settings Section */}
          <div className="section">
            <h2>Advanced Settings</h2>
            {MISSION_PLAN_FIELDS.advancedSettings.map((field) => (
              <div key={field.name} className="form-field">
                <label>{field.label}{field.required && ' *'}</label>
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                >
                  <option value="">-- Select --</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Signature Section */}
          <div className="section">
            <h2>Pilot Signature</h2>
            <canvas
              ref={canvasRef}
              width={500}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                border: '2px solid #0a4da3',
                borderRadius: '8px',
                cursor: 'crosshair',
                backgroundColor: '#fff'
              }}
            />
            <button
              type="button"
              onClick={clearSignature}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Signature
            </button>
          </div>

          {!success && (
            <div className="button-group">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                Submit Mission Plan
              </button>

              {Object.keys(formData).length > 0 && (
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
              <p>Submitting your mission plan...</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <strong>✅ Success!</strong> Your mission plan has been submitted successfully.
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

export default MissionPlan;
