import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button } from 'react-bootstrap';
import API_BASE_URL from '../config';

const Cart = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [cartItems, setCartItems] = useState([]);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      setToken('');
      localStorage.removeItem('token');
    }
    return response;
  };

  const fetchCartItems = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/cart/`)
      .then(response => response.json())
      .then(data => setCartItems(data))
      .catch(error => console.error("Erreur lors de la récupération des articles du panier:", error));
  };

  const handleRemoveFromCart = (itemId) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/cart/items/${itemId}`,
      {
        method: 'DELETE',
      })
      .then(response => {
        if (response.ok) {
          fetchCartItems();
        } else {
          console.error("Erreur lors de la suppression de l'article du panier");
        }
      })
      .catch(error => console.error("Erreur lors de la suppression de l'article du panier:", error));
  };

  const handleSubmitCart = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/cart/submit`, {
      method: 'POST',
    })
      .then(response => response.json())
      .then(() => {
        alert("Panier validé et demandes envoyées !");
        fetchCart();
      })
      .catch(error => console.error("Erreur lors de la validation du panier:", error));
  };

  if (!cart) {
    return <Container className="mt-4"><div>Chargement du panier...</div></Container>;
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h1">Panier</Card.Header>
        <Card.Body>
          {cart.items.length === 0 ? (
            <p>Votre panier est vide.</p>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Type de demande</th>
                    <th>Type de matériel</th>
                    <th>Référence interne</th>
                    <th>Localisation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.request_type}</td>
                      <td>{item.materiel.material_type ? item.materiel.material_type.name : 'N/A Type'}</td>
                      <td>{item.materiel.reference_interne || 'pas de réf. -'}</td>
                      <td>
                        {item.materiel.localisation && (
                          <span>
                            {item.materiel.localisation.nom_etablissement}, {item.materiel.localisation.secteur}, Ch. {item.materiel.localisation.numero_chambre} - {item.materiel.localisation.nom_complet_resident}
                          </span>
                        )}
                      </td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveFromCart(item.id)}>Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="success" onClick={handleSubmitCart} className="mt-3">Valider et envoyer les demandes</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Cart;