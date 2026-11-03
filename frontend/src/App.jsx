import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './pages/HomePage/Home';
import ChooseAccount from './pages/HomePage/ChooseAccount';
import UserSignup from './pages/HomePage/UserSignup';
import ProviderSignup from './pages/HomePage/ProviderSignup';
import Login from './pages/HomePage/Login';

import UserDashboard from './pages/UserDashboard/UserDashboard';
import UserBookings from './pages/UserDashboard/UserBookings';
import UserServices from './pages/UserDashboard/UserServices';
import ProviderProfile from './pages/UserDashboard/ProviderProfile';
import BookService from './pages/UserDashboard/BookService';
import BookingConfirmation from './pages/UserDashboard/BookingConfirmation';
import UserSettings from './pages/UserDashboard/UserSettings';

import ProviderDashboard from './pages/ProviderDashboard/ProviderDashboard';
import ProviderServices from './pages/ProviderDashboard/ProviderServices';
import ProviderBookings from './pages/ProviderDashboard/ProviderBookings';
import ProviderReviews from './pages/ProviderDashboard/ProviderReviews';
import ProviderSettings from './pages/ProviderDashboard/ProviderSettings';

import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminProviders from './pages/AdminDashboard/AdminProviders';
import AdminBookings from './pages/AdminDashboard/AdminBookings';
import AdminCategories from './pages/AdminDashboard/AdminCategories';
import AdminUsers from './pages/AdminDashboard/AdminUsers';
import AdminSettings from './pages/AdminDashboard/AdminSettings';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const customerPage = (element) => (
    <ProtectedRoute allowedRoles={['customer']}>
      {element}
    </ProtectedRoute>
  );

  const providerPage = (element) => (
    <ProtectedRoute allowedRoles={['provider']}>
      {element}
    </ProtectedRoute>
  );

  const adminPage = (element) => (
    <ProtectedRoute allowedRoles={['admin']}>
      {element}
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/choose-account" element={<ChooseAccount />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/provider-signup" element={<ProviderSignup />} />
        <Route path="/login" element={<Login />} />

        {/* Customer pages */}
        <Route
          path="/user-dashboard"
          element={customerPage(<UserDashboard />)}
        />
        <Route
          path="/user-bookings"
          element={customerPage(<UserBookings />)}
        />
        <Route
          path="/user-services"
          element={customerPage(<UserServices />)}
        />
        <Route
          path="/user-settings"
          element={customerPage(<UserSettings />)}
        />
        <Route
          path="/provider/:id"
          element={customerPage(<ProviderProfile />)}
        />
        <Route
          path="/book-service/:id"
          element={customerPage(<BookService />)}
        />
        <Route
          path="/booking-confirmation"
          element={customerPage(<BookingConfirmation />)}
        />

        {/* Provider pages */}
        <Route
          path="/provider-dashboard"
          element={providerPage(<ProviderDashboard />)}
        />
        <Route
          path="/provider-services"
          element={providerPage(<ProviderServices />)}
        />
        <Route
          path="/provider-bookings"
          element={providerPage(<ProviderBookings />)}
        />
        <Route
          path="/provider-reviews"
          element={providerPage(<ProviderReviews />)}
        />
        <Route
          path="/provider-settings"
          element={providerPage(<ProviderSettings />)}
        />

        {/* Admin pages */}
        <Route
          path="/admin-dashboard"
          element={adminPage(<AdminDashboard />)}
        />
        <Route
          path="/admin-providers"
          element={adminPage(<AdminProviders />)}
        />
        <Route
          path="/admin-bookings"
          element={adminPage(<AdminBookings />)}
        />
        <Route
          path="/admin-categories"
          element={adminPage(<AdminCategories />)}
        />
        <Route
          path="/admin-users"
          element={adminPage(<AdminUsers />)}
        />
        <Route
          path="/admin-settings"
          element={adminPage(<AdminSettings />)}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;