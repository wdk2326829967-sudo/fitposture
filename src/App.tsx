import { Routes, Route } from 'react-router-dom';
import Home from './features/home/Home';
import MuscleDetail from './features/muscle/MuscleDetail';
import PostureLibrary from './features/posture/PostureLibrary';
import PostureDetail from './features/posture/PostureDetail';
import SymptomFinder from './features/symptom/SymptomFinder';
import SymptomDetail from './features/symptom/SymptomDetail';
import AuthPage from './features/auth/AuthPage';
import MePage from './features/me/MePage';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/muscle/:id" element={<MuscleDetail />} />
        <Route path="/muscle/:id/:part" element={<MuscleDetail />} />
        <Route path="/posture" element={<PostureLibrary />} />
        <Route path="/posture/:id" element={<PostureDetail />} />
        <Route path="/symptoms" element={<SymptomFinder />} />
        <Route path="/symptoms/:id" element={<SymptomDetail />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
