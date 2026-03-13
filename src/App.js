import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KMLUpload from './pages/KMLUpload';
import PilotChecklist from './pages/PilotChecklist';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KMLUpload />} />
        <Route path="/checklist" element={<PilotChecklist />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
