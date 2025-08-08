import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { Container, Card, Table, Form, Button } from 'react-bootstrap';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return fetch(url, { ...options, headers });
  };

  const fetchRequests = () => {
    if (!token) return;
    fetchWithAuth('http://localhost:8000/requests/')
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text || 'Network response was not ok') });
        }
        return response.json();
      })
      .then(data => setRequests(data))
      .catch(error => console.error("Erreur lors de la récupération des demandes:", error));
  };

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
    fetchRequests();
  }, [token]);

  const handleStatusChange = (requestId, newStatus) => {
    fetchWithAuth(`http://localhost:8000/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('La mise à jour du statut a échoué');
      }
      return response.json();
    })
    .then(updatedRequest => {
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: updatedRequest.status } : req
        )
      );
    })
    .catch(error => console.error("Erreur lors de la mise à jour du statut:", error));
  };

  const handleDeleteRequest = (requestId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      fetchWithAuth(`http://localhost:8000/requests/${requestId}`, {
        method: 'DELETE',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('La suppression de la demande a échoué');
        }
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      })
      .catch(error => console.error("Erreur lors de la suppression de la demande:", error));
    }
  };

  const requestStatusEnum = [
    "EN ATTENTE",
    "PRISE EN COMPTE",
    "EN COURS DE REALISATION",
    "TERMINEE"
  ];

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h1">Demandes de service</Card.Header>
        <Card.Body>
          {requests.length === 0 ? (
            <p>Aucune demande trouvée.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  
                  {isAdmin && <th>Demandeur</th>}
                  <th>Type de demande</th>
                  <th>Type de matériel</th>
                  <th>Référence interne</th>
                  <th>Localisation</th>
                  <th>Statut</th>
                  <th>Date de création</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    
                    {isAdmin && <td>{request.user ? request.user.username : 'Utilisateur supprimé'}</td>}
                    <td>{request.request_type}</td>
                    <td>{request.materiel && request.materiel.material_type ? request.materiel.material_type.name : 'N/A'}</td>
                    <td>{request.materiel ? request.materiel.reference_interne : 'N/A'}</td>
                    <td>
                      {request.materiel && request.materiel.localisation ? (
                        <span>
                          {`${request.materiel.localisation.nom_etablissement}, ${request.materiel.localisation.secteur}, Ch. ${request.materiel.localisation.numero_chambre} - ${request.materiel.localisation.nom_complet_resident}`}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {isAdmin ? (
                        <Form.Select
                          size="sm"
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          aria-label="Changer le statut"
                        >
                          {requestStatusEnum.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        request.status
                      )}
                    </td>
                    <td>{new Date(request.created_at).toLocaleString()}</td>
                    {isAdmin && (
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Requests;