
import React from 'react';
import { Form, Button, Card, Table, Row, Col, InputGroup } from 'react-bootstrap';

const Localisations = ({
  localisations,
  editingLocalisationId,
  handleLocalisationSubmit,
  handleEditLocalisation,
  handleCancelEditLocalisation,
  handleDeleteLocalisation,
  localisationSearchQuery,
  setLocalisationSearchQuery,
  isAdmin,
  selectedUserId,
  setSelectedUserId,
  users,
  currentUserUsername,
  secteur,
  setSecteur,
  numeroChambre,
  setNumeroChambre,
  nomCompletResident,
  setNomCompletResident,
}) => {
  return (
    <Card className="mb-4">
      <Card.Header as="h2">Localisations</Card.Header>
      <Card.Body>
        <Form onSubmit={handleLocalisationSubmit} className="mb-4">
          <Card>
            <Card.Header as="h3">{editingLocalisationId ? 'Modifier la localisation' : 'Ajouter une localisation'}</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom de l'établissement:</Form.Label>
                    {isAdmin ? (
                      <Form.Control as="select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                        <option value="">-- Sélectionner un établissement (propriétaire) --</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </Form.Control>
                    ) : (
                      <Form.Control type="text" value={currentUserUsername} readOnly />
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Secteur:</Form.Label>
                    <Form.Control type="text" value={secteur} onChange={e => setSecteur(e.target.value)} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Numéro de chambre:</Form.Label>
                    <Form.Control type="text" value={numeroChambre} onChange={e => setNumeroChambre(e.target.value)} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom complet du résident:</Form.Label>
                    <Form.Control type="text" value={nomCompletResident} onChange={e => setNomCompletResident(e.target.value)} required />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" type="submit">{editingLocalisationId ? 'Modifier' : 'Ajouter'}</Button>
              {editingLocalisationId && (
                <Button variant="secondary" onClick={handleCancelEditLocalisation} className="ms-2">Annuler</Button>
              )}
            </Card.Body>
          </Card>
        </Form>

        <Card>
          <Card.Header as="h3">Liste des localisations</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>Rechercher:</InputGroup.Text>
                <Form.Control type="text" value={localisationSearchQuery} onChange={e => setLocalisationSearchQuery(e.target.value)} placeholder="Rechercher localisation..." />
              </InputGroup>
            </Form.Group>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Secteur</th>
                  <th>Chambre</th>
                  <th>Résident</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localisations.map((localisation) => (
                  <tr key={localisation.id}>
                    <td>{localisation.nom_etablissement}</td>
                    <td>{localisation.secteur}</td>
                    <td>{localisation.numero_chambre}</td>
                    <td>{localisation.nom_complet_resident}</td>
                    <td>
                      <Button variant="warning" size="sm" onClick={() => handleEditLocalisation(localisation)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteLocalisation(localisation.id)} className="ms-2">Supprimer</Button>
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

export default Localisations;
