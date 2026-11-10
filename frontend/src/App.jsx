import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import PrototypeDetails from './pages/PrototypeDetails';
import HostedPrototype from './pages/HostedPrototype';
import MyInstances from './pages/MyInstances';

const guard = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={guard(<Catalog />)} />
      <Route path="/prototypes/:id" element={guard(<PrototypeDetails />)} />
      <Route path="/my-instances" element={guard(<MyInstances />)} />
      <Route path="/hosted/:instance_id" element={guard(<HostedPrototype />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
