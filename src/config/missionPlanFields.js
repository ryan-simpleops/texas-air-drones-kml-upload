// Mission Plan Form Field Definitions
// Extracted from Google Sheets: 1_BsO1w1C5w2oeDWlMnVkbvdXk6YCIITQNL4ffdLXU9Y

export const MISSION_PLAN_FIELDS = {
  // Customer Information Section
  customerInfo: [
    { name: 'projectName', label: 'PROJECT NAME', type: 'text', required: true },
    { name: 'address', label: 'ADDRESS', type: 'text', required: true },
    { name: 'pointOfContact', label: 'POINT of CONTACT', type: 'text', required: true },
    { name: 'phone', label: 'PHONE #', type: 'tel', required: true }
  ],

  // Controller Settings Section
  controllerSettings: [
    {
      name: 'drone',
      label: 'DRONE',
      type: 'select',
      required: true,
      options: ['Matrice 350', 'Mavic 3M', 'Matrice 4E']
    },
    {
      name: 'type',
      label: 'TYPE',
      type: 'select',
      required: true,
      options: ['Nadir', 'Oblique', 'Facade']
    },
    {
      name: 'gsd',
      label: 'GSD',
      type: 'select',
      required: true,
      options: ['0.30', '0.40', '0.50', '0.60', '0.70', '0.80', '0.90', '1.00', '1.10', '1.20', '1.30', '1.40', '1.50']
    },
    {
      name: 'obliqueGsd',
      label: 'OBLIQUE GSD',
      type: 'select',
      required: false,
      options: ['0.30', '0.40', '0.50', '0.60', '0.70', '0.80', '0.90', '1.00', '1.10', '1.20', '1.30', '1.40', '1.50']
    },
    {
      name: 'smartOblique',
      label: 'SMART OBLIQUE',
      type: 'select',
      required: true,
      options: ['YES', 'NO']
    },
    {
      name: 'gimbalPitch',
      label: 'GIMBAL PITCH (oblique only)',
      type: 'select',
      required: false,
      options: ['25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%']
    },
    {
      name: 'altitudeMode',
      label: 'ALTITUDE MODE',
      type: 'select',
      required: true,
      options: ['Relative to Takeoff Point (ALT)', 'ASL (EGM96)', 'AGL']
    },
    {
      name: 'routeAltitude',
      label: 'ROUTE ALTITUDE',
      type: 'select',
      required: true,
      options: ['50 Ft', '60 Ft', '70 Ft', '80 Ft', '90 Ft', '100 Ft', '110 Ft', '120 Ft', '130 Ft', '140 Ft', '150 Ft', '160 Ft', '170 Ft', '180 Ft', '190 Ft', '200 Ft', '220 Ft', '240 Ft', '260 Ft', '280 Ft', '300 Ft', '320 Ft', '340 Ft', '360 Ft', '380 Ft', '400 Ft']
    },
    {
      name: 'speed',
      label: 'SPEED',
      type: 'select',
      required: true,
      options: ['4 MPH', '6 MPH', '8 MPH', '10 MPH', '12 MPH', '14 MPH', '16 MPH', '18 MPH', '20 MPH', '22 MPH', '24 MPH', '26 MPH', '28 MPH', '30 MPH']
    },
    {
      name: 'courseAngle',
      label: 'COURSE ANGLE',
      type: 'select',
      required: true,
      options: ['Vertical', 'Horizontal']  // Fixed typo from "Horizotal"
    },
    {
      name: 'uponCompletion',
      label: 'UPON COMPLETION',
      type: 'select',
      required: true,
      options: ['Return to Home', 'Land', 'Return to start point & hover']
    }
  ],

  // Advanced Settings Section
  advancedSettings: [
    {
      name: 'targetSurface',
      label: 'TARGET SURFACE TO TAKEOFF PT',
      type: 'select',
      required: true,
      options: ['50', '75', '100', '125', '150', '175', '200', '225', '250', '275', '300', '325', '350', '375', '400']
    },
    {
      name: 'sideOverlap',
      label: 'SIDE OVERLAP',
      type: 'select',
      required: true,
      options: ['65%', '70%', '75%', '80%', '85%', '90%']
    },
    {
      name: 'frontOverlap',
      label: 'FRONT OVERLAP',
      type: 'select',
      required: true,
      options: ['65%', '70%', '75%', '80%', '85%', '90%']
    },
    {
      name: 'sideOverlapOblique',
      label: 'SIDE OVERLAP OBLIQUE',
      type: 'select',
      required: false,
      options: ['65%', '70%', '75%', '80%', '85%', '90%']
    },
    {
      name: 'frontOverlapOblique',
      label: 'FRONT OVERLAP OBLIQUE',
      type: 'select',
      required: false,
      options: ['65%', '70%', '75%', '80%', '85%', '90%']
    },
    {
      name: 'margin',
      label: 'MARGIN',
      type: 'select',
      required: true,
      options: ['5%', '10%', '15%', '20%', '25%']
    },
    {
      name: 'distanceTimeInterval',
      label: 'DISTANCE / TIME INTERVAL',
      type: 'select',
      required: true,
      options: ['Distance', 'Time']
    },
    {
      name: 'takeoffSpeed',
      label: 'TAKEOFF SPEED',
      type: 'select',
      required: true,
      options: ['10 MPH', '15 MPH', '20 MPH', '25 MPH', '30 MPH', '35 MPH']
    },
    {
      name: 'payload',
      label: 'PAYLOAD',
      type: 'select',
      required: true,
      options: ['65 R', 'Multispectral', 'Wiris', 'R3 Pro']
    }
  ]
};

export default MISSION_PLAN_FIELDS;
