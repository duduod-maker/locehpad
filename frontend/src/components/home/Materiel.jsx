
import React from 'react';
import { Form, Button, Card, Table, Row, Col, InputGroup } from 'react-bootstrap';

const Materiel = ({
  materiels,
  editingMaterielId,
  handleMaterielSubmit,
  handleEditMateriel,
  handleCancelEditMateriel,
  handleDeleteMateriel,
  handleAddToCart,
  handleDirectRequest,
  materielSearchQuery,
  setMaterielSearchQuery,
  selectedMaterialTypeId,
  setSelectedMaterialTypeId,
  materialTypes,
  referenceInterne,
  setReferenceInterne,
  selectedLocalisationId,
  setSelectedLocalisationId,
  localisations,
  isAdmin,
  selectedMaterialOwnerId,
  setSelectedMaterialOwnerId,
  users,
  dateLivraison,
  setDateLivraison,
  dateReprise,
  setDateReprise,
}) => {
  return (
    <Card className="mb-4">
      <Card.Header as="h2">Matériel</Card.Header>
      <Card.Body>
        <Form onSubmit={handleMaterielSubmit} className="mb-4">
          <Card>
            <Card.Header as="h3">{editingMaterielId ? 'Modifier le matériel' : 'Ajouter du matériel'}</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type de matériel:</Form.Label>
                    <Form.Control as="select" value={selectedMaterialTypeId} onChange={e => setSelectedMaterialTypeId(e.target.value)} required>
                      <option value="">-- Sélectionner un type de matériel --</option>
                      {materialTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Référence interne:</Form.Label>
                    <Form.Control type="text" value={referenceInterne} onChange={e => setReferenceInterne(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Localisation:</Form.Label>
                    <Form.Control as="select" value={selectedLocalisationId} onChange={e => setSelectedLocalisationId(e.target.value)}>
                      <option value="">-- Sélectionner une localisation --</option>
                      {localisations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nom_etablissement}, {loc.secteur}, Ch. {loc.numero_chambre} ({loc.nom_complet_resident})
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                {isAdmin && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Propriétaire (Maison de retraite):</Form.Label>
                      <Form.Control as="select" value={selectedMaterialOwnerId} onChange={e => setSelectedMaterialOwnerId(e.target.value)} required>
                        <option value="">-- Sélectionner un propriétaire --</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                )}
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de livraison:</Form.Label>
                    <Form.Control type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de reprise:</Form.Label>
                    <Form.Control type="date" value={dateReprise} onChange={e => setDateReprise(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" type="submit">{editingMaterielId ? 'Modifier' : 'Ajouter'}</Button>
              {editingMaterielId && (
                <Button variant="secondary" onClick={handleCancelEditMateriel} className="ms-2">Annuler</Button>
              )}
            </Card.Body>
          </Card>
        </Form>

        <Card>
          <Card.Header as="h3">Liste du matériel</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>Rechercher:</InputGroup.Text>
                <Form.Control type="text" value={materielSearchQuery} onChange={e => setMaterielSearchQuery(e.target.value)} placeholder="Rechercher matériel..." />
              </InputGroup>
            </Form.Group>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Référence</th>
                  <th>Localisation</th>
                  <th>Livraison</th>
                  <th>Reprise</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materiels.map((materiel) => (
                  <tr key={materiel.id}>
                    <td>{materiel.material_type ? materiel.material_type.name : 'N/A'}</td>
                    <td>{materiel.reference_interne}</td>
                    <td>
                      {materiel.localisation && (
                        <span>
                          {materiel.localisation.nom_etablissement}, {materiel.localisation.secteur}, Ch. {materiel.localisation.numero_chambre} - {materiel.localisation.nom_complet_resident}
                        </span>
                      )}
                    </td>
                    <td>{materiel.date_livraison && new Date(materiel.date_livraison).toLocaleDateString()}</td>
                    <td>{materiel.date_reprise && new Date(materiel.date_reprise).toLocaleDateString()}</td>
                    <td>
                      <Button variant="warning" size="sm" onClick={() => handleEditMateriel(materiel)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteMateriel(materiel.id)} className="ms-2">Supprimer</Button>
                      {isAdmin ? (
                        <Button variant="info" size="sm" onClick={() => handleDirectRequest(materiel)} className="ms-2">Créer une demande</Button>
                      ) : (
                        <Button variant="success" size="sm" onClick={() => handleAddToCart(materiel)} className="ms-2">Ajouter au panier</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
};

export default Materiel;
