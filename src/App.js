import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KMLUpload from './pages/KMLUpload';
import PilotChecklist from './pages/PilotChecklist';
import MissionPlan from './pages/MissionPlan';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KMLUpload />} />
        <Route path="/checklist" element={<PilotChecklist />} />
        <Route path="/mission-plan" element={<MissionPlan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
