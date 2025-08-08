import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Row, Col } from 'react-bootstrap';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    return fetch(url, { ...options, headers });
  };

  const fetchCart = () => {
    if (!token) return;
    fetchWithAuth('http://localhost:8000/cart/')
      .then(response => response.json())
      .then(data => setCart(data))
      .catch(error => console.error("Erreur lors de la récupération du panier:", error));
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const handleRemoveFromCart = (itemId) => {
    fetchWithAuth(`http://localhost:8000/cart/items/${itemId}`,
      {
        method: 'DELETE',
      }
    )
      .then(() => {
        fetchCart();
      })
      .catch(error => console.error("Erreur lors de la suppression de l'article du panier:", error));
  };

  const handleSubmitCart = () => {
    fetchWithAuth('http://localhost:8000/cart/submit', {
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