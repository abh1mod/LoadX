import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminShipments from './pages/admin/AdminShipments';

// Supplier Pages
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierShipments from './pages/supplier/SupplierShipments';
import ShipmentFormPage from './pages/supplier/ShipmentFormPage';
import SupplierShipmentDetail from './pages/supplier/SupplierShipmentDetail';

// Transporter Pages
import TransporterBrowse from './pages/transporter/TransporterBrowse';
import TransporterShipmentDetail from './pages/transporter/TransporterShipmentDetail';
import TransporterMyBids from './pages/transporter/TransporterMyBids';
import TransporterAwarded from './pages/transporter/TransporterAwarded';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '10px'
          }
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Protected Routes */}
        <Route element={<DashboardLayout allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/shipments" element={<AdminShipments />} />
        </Route>

        {/* Supplier Protected Routes */}
        <Route element={<DashboardLayout allowedRoles={['SUPPLIER']} />}>
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/supplier/shipments" element={<SupplierShipments />} />
          <Route path="/supplier/shipments/new" element={<ShipmentFormPage mode="create" />} />
          <Route path="/supplier/shipments/:id" element={<SupplierShipmentDetail />} />
          <Route path="/supplier/shipments/:id/edit" element={<ShipmentFormPage mode="edit" />} />
          <Route path="/supplier/shipments/:id/repost" element={<ShipmentFormPage mode="repost" />} />
        </Route>

        {/* Transporter Protected Routes */}
        <Route element={<DashboardLayout allowedRoles={['TRANSPORTER']} />}>
          <Route path="/transporter" element={<TransporterBrowse />} />
          <Route path="/transporter/shipments/:id" element={<TransporterShipmentDetail />} />
          <Route path="/transporter/my-bids" element={<TransporterMyBids />} />
          <Route path="/transporter/awarded" element={<TransporterAwarded />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
