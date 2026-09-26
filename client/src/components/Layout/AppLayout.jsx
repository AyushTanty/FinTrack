import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav, Offcanvas, Button, Badge } from 'react-bootstrap';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  PiggyBank,
  BarChart2,
  Settings,
  Menu,
  LogOut,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QuickAddModal from '../QuickAdd/QuickAddModal';
import './AppLayout.css';

const AppLayout = () => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={18}/>, label: "Dashboard" },
    { to: "/money", icon: <Wallet size={18}/>, label: "Money" },
    { to: "/expenses", icon: <Receipt size={18}/>, label: "Expenses" },
    { to: "/subscriptions", icon: <RefreshCcw size={18}/>, label: "Subscriptions" },
    { to: "/purchases", icon: <ShoppingCart size={18}/>, label: "Purchases" },
    { to: "/savings", icon: <PiggyBank size={18}/>, label: "Savings" },
    { to: "/reports", icon: <BarChart2 size={18}/>, label: "Reports" },
    { to: "/ai", icon: <Sparkles size={18} className="text-warning"/>, label: "AI Assistant" },
    { to: "/settings", icon: <Settings size={18}/>, label: "Settings" }
  ];

  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.to)) || { label: "Overview" };

  // Detect whether current route is in secondary/drawer sections (for mobile header menu indicator)
  const isMoreActive = ['/money', '/reports', '/ai', '/settings', '/audit'].some(path =>
    location.pathname.startsWith(path)
  );

  const SidebarContent = ({ isDrawer = false }) => (
    <div className="d-flex flex-column h-100 p-3">
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-between pb-3 mb-2 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2">
          <span className="brand-dot"></span>
          <span className="fw-bold tracking-tight text-white fs-5">FinTrack</span>
          <Badge bg="dark" className="border border-secondary border-opacity-25 text-muted small fw-normal py-0.5 px-1.5 ms-1">
            v1.2
          </Badge>
        </div>
        {isDrawer && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-md-none border-0 p-1 text-secondary hover-text-white d-flex align-items-center"
            onClick={() => setShowOffcanvas(false)}
            aria-label="Close menu drawer"
          >
            <X size={20} />
          </Button>
        )}
      </div>

      {/* Quick Add Button */}
      <div className="my-2">
        <Button
          className="btn-quick-add w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          onClick={() => {
            setShowOffcanvas(false);
            setShowQuickAdd(true);
          }}
        >
          <Plus size={16} strokeWidth={2.5}/>
          <span>Quick Add</span>
        </Button>
      </div>

      {/* Main Nav */}
      <Nav className="flex-column flex-grow-1 my-2 overflow-y-auto">
        {navItems.map(item => (
          <Nav.Link
            key={item.to}
            as={NavLink}
            to={item.to}
            onClick={() => setShowOffcanvas(false)}
            className="nav-item-link d-flex align-items-center gap-3"
          >
            {item.icon}
            <span>{item.label}</span>
          </Nav.Link>
        ))}
      </Nav>

      {/* User & Logout */}
      <div className="pt-3 border-top border-secondary border-opacity-25 mt-auto">
        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
          <div className="text-truncate text-secondary small" style={{ maxWidth: '170px' }}>
            {user?.email}
          </div>
        </div>
        <Button
          variant="outline-danger"
          size="sm"
          className="w-100 d-flex align-items-center justify-content-center gap-2 py-1"
          onClick={handleLogout}
        >
          <LogOut size={14}/>
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <div className="app-layout-body">
        {/* Desktop Sidebar */}
        <aside className="sidebar-panel d-none d-md-flex flex-column">
          <SidebarContent isDrawer={false} />
        </aside>

        {/* Main Content Area */}
        <div className="app-content-area">
          {/* Desktop Top Header */}
          <header className="top-header d-none d-md-flex align-items-center justify-content-between px-4">
            <div className="d-flex align-items-center gap-2">
              <span className="text-white fw-semibold fs-5">{currentNavItem.label}</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Button
                className="btn-quick-add d-flex align-items-center gap-1.5 shadow-sm"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus size={16} strokeWidth={2.5}/>
                <span>Add Transaction</span>
              </Button>
            </div>
          </header>

          {/* Mobile Top Header */}
          <header className="mobile-top-header d-md-none d-flex align-items-center justify-content-between px-3">
            <div className="d-flex align-items-center gap-2">
              <span className="brand-dot"></span>
              <span className="text-white fw-bold tracking-tight">FinTrack</span>
              <span className="text-secondary small opacity-50">/</span>
              <span className="text-white small fw-medium text-truncate" style={{ maxWidth: '130px' }}>
                {currentNavItem.label}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                size="sm"
                className="btn-quick-add py-1 px-2.5 d-flex align-items-center gap-1 shadow-sm"
                onClick={() => setShowQuickAdd(true)}
                aria-label="Quick Add"
              >
                <Plus size={15} strokeWidth={2.5}/>
                <span className="small fw-semibold">Add</span>
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowOffcanvas(true)}
                className="border-0 p-1 text-secondary hover-text-white d-flex align-items-center position-relative"
                aria-label="Open menu drawer"
              >
                <Menu size={22}/>
                {isMoreActive && (
                  <span
                    className="position-absolute top-0 end-0 bg-primary rounded-circle"
                    style={{ width: '6px', height: '6px', transform: 'translate(1px, 2px)' }}
                  />
                )}
              </Button>
            </div>
          </header>

          {/* Scrollable Page Viewport */}
          <main className="page-viewport">
            <Container fluid className="main-content p-0">
              <Outlet />
            </Container>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (5 items max) */}
      <nav className="mobile-bottom-nav d-md-none" aria-label="Mobile Navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Today</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Receipt size={20} />
          <span>Expenses</span>
        </NavLink>

        <NavLink
          to="/subscriptions"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <RefreshCcw size={20} />
          <span>Subs</span>
        </NavLink>

        <NavLink
          to="/savings"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <PiggyBank size={20} />
          <span>Savings</span>
        </NavLink>

        <NavLink
          to="/purchases"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingCart size={20} />
          <span>Purchases</span>
        </NavLink>
      </nav>

      {/* Mobile Offcanvas Drawer */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="start"
        className="d-md-none offcanvas-dark"
        style={{ width: '280px', maxWidth: '85vw' }}
      >
        <Offcanvas.Body className="p-0">
          <SidebarContent isDrawer={true} />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        show={showQuickAdd}
        onHide={() => setShowQuickAdd(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default AppLayout;
