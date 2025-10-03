import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { FaTachometerAlt, FaBoxes, FaCashRegister, FaClipboardList, FaFillDrip, FaTasks, FaReceipt } from 'react-icons/fa';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import CustomOrdersPage from './pages/CustomOrdersPage';
import FilamentPage from './pages/FilamentPage';
import PrintQueuePage from './pages/PrintQueuePage';
import ExpensesPage from './pages/ExpensesPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">3D Print Stall Management System</div>
          <nav className="nav-links">
            <NavLink to="/" end>
              <FaTachometerAlt />
              Dashboard
            </NavLink>
            <NavLink to="/inventory">
              <FaBoxes />
              Inventory
            </NavLink>
            <NavLink to="/sales">
              <FaCashRegister />
              Sales Sessions
            </NavLink>
            <NavLink to="/custom-orders">
              <FaClipboardList />
              Custom Orders
            </NavLink>
            <NavLink to="/filament">
              <FaFillDrip />
              Filament
            </NavLink>
            <NavLink to="/print-queue">
              <FaTasks />
              Print Queue
            </NavLink>
            <NavLink to="/expenses">
              <FaReceipt />
              Expenses
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/custom-orders" element={<CustomOrdersPage />} />
            <Route path="/filament" element={<FilamentPage />} />
            <Route path="/print-queue" element={<PrintQueuePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
