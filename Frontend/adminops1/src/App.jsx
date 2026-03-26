import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import UniversityRepositories from './pages/UniversityRepositories';
import AddUniversity from './pages/AddUniversity';
import UniversityDetails from './pages/UniversityDetails';
import PartnersManagement from './pages/PartnersManagement';
import ProtectRoute from './components/ProtectRoute';
function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectRoute><Dashboard /></ProtectRoute>} />
          <Route path="/dashboard/university-repositories" element={<ProtectRoute><UniversityRepositories /></ProtectRoute>} />
          <Route path="/dashboard/add-university" element={<ProtectRoute><AddUniversity /></ProtectRoute>} />
          <Route path="/dashboard/university/:id" element={<ProtectRoute><UniversityDetails /></ProtectRoute>} />
          <Route path="/dashboard/partners" element={<ProtectRoute><PartnersManagement /></ProtectRoute>} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Routes>
      </Router>
    </>
  )
}

export default App
