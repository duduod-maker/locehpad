import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Table, Row, Col } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from '../config';

const MaterialFilter = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [materiels, setMateriels] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);

  // Filter states
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateReprise, setStartDateReprise] = useState('');
  const [endDateReprise, setEndDateReprise] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      setToken('');
      localStorage.removeItem('token');
      setIsAdmin(false);
    }
    return response;
  };

  const fetchMaterialTypes = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/material_types/`)
      .then(response => response.json())
      .then(data => setMaterialTypes(data))
      .catch(error => console.error("Erreur lors de la récupération des types de matériel:", error));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    if (!token) return;

    let url = `${API_BASE_URL}/materiels/?`;
    const params = new URLSearchParams();

    if (searchQuery) {
      params.append('search_query', searchQuery);
    }
    if (selectedMaterialTypeId) {
      params.append('material_type_id', selectedMaterialTypeId);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    if (startDateReprise) {
      params.append('start_date_reprise', startDateReprise);
    }
    if (endDateReprise) {
      params.append('end_date_reprise', endDateReprise);
    }

    fetchWithAuth(url + params.toString())
      .then(response => response.json())
      .then(data => setMateriels(data))
      .catch(error => console.error("Erreur lors de la récupération des matériels filtrés:", error));
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
      fetchMaterialTypes();
      handleFilterSubmit({ preventDefault: () => {} }); // Initial fetch
    }
  }, [token]);

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h1">Filtrer le Matériel</Card.Header>
        <Card.Body>
          <Form onSubmit={handleFilterSubmit} className="mb-4">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recherche par texte:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Référence, localisation, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type de matériel:</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedMaterialTypeId}
                    onChange={(e) => setSelectedMaterialTypeId(e.target.value)}
                  >
                    <option value="">Tous les types</option>
                    {materialTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de livraison (début):</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de livraison (fin):</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de reprise (début):</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDateReprise}
                    onChange={(e) => setStartDateReprise(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de reprise (fin):</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDateReprise}
                    onChange={(e) => setEndDateReprise(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" type="submit">Appliquer les filtres</Button>
          </Form>

          <h3>Résultats du filtrage</h3>
          {materiels.length === 0 ? (
            <p>Aucun matériel trouvé avec les critères de filtrage.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Référence</th>
                  <th>Localisation</th>
                  <th>Livraison</th>
                  <th>Reprise</th>
                </tr>
              </thead>
              <tbody>
                {materiels.map((materiel) => (
                  <tr key={materiel.id}>
                    <td>{materiel.material_type ? materiel.material_type.name : 'N/A'}</td>
                    <td>{materiel.reference_interne}</td>
                    <td>
                      {materiel.localisation ? (
                        <span>
                          {materiel.localisation.nom_etablissement}, {materiel.localisation.secteur}, Ch. {materiel.localisation.numero_chambre} - {materiel.localisation.nom_complet_resident}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>{materiel.date_livraison && new Date(materiel.date_livraison).toLocaleDateString()}</td>
                    <td>{materiel.date_reprise && new Date(materiel.date_reprise).toLocaleDateString()}</td>
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

export default MaterialFilter;
