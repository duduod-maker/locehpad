import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

import Home from './pages/Home';
import Requests from './pages/Requests';
import Cart from './pages/Cart';
import MaterialFilter from './pages/MaterialFilter';
import Auth from './components/Auth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setIsAdmin(decodedToken.is_admin || false);
      } catch (error) {
        console.error("Erreur de décodage du token:", error);
        setToken('');
        localStorage.removeItem('token');
        setIsAdmin(false);
      }
    }
  }, [token]);

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setIsAdmin(false);
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Gestion Matériel Médical</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {token && (
                <>
                  <Nav.Link as={Link} to="/">Accueil</Nav.Link>
                  <Nav.Link as={Link} to="/requests">Demandes</Nav.Link>
                  <Nav.Link as={Link} to="/cart">Panier</Nav.Link>
                  <Nav.Link as={Link} to="/material-filter">Filtrer Matériel</Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {token ? (
                <Button variant="outline-light" onClick={handleLogout}>Déconnexion</Button>
              ) : (
                <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/login" element={!token ? <Auth setToken={setToken} setIsAdmin={setIsAdmin} /> : <Navigate to="/" />} />
          <Route path="/requests" element={token ? <Requests /> : <Navigate to="/login" />} />
          <Route path="/cart" element={token ? <Cart /> : <Navigate to="/login" />} />
          <Route path="/material-filter" element={token ? <MaterialFilter /> : <Navigate to="/login" />} />
          <Route path="/" element={token ? <Home /> : <Navigate to="/login" />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
