import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Loading from '@/pages/Loading';
import Fixture from '@/pages/Fixture';
import Welding from '@/pages/Welding';
import Inspection from '@/pages/Inspection';
import Repair from '@/pages/Repair';
import Cycle from '@/pages/Cycle';
import Maintenance from '@/pages/Maintenance';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/fixture" element={<Fixture />} />
          <Route path="/welding" element={<Welding />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/cycle" element={<Cycle />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Route>
      </Routes>
    </Router>
  );
}
