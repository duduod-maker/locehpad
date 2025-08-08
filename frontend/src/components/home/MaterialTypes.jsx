
import React from 'react';
import { Form, Button, Card, Table, Row, Col } from 'react-bootstrap';

const MaterialTypes = ({
  materialTypes,
  editingMaterialTypeId,
  handleMaterialTypeSubmit,
  handleEditMaterialType,
  handleCancelEditMaterialType,
  handleDeleteMaterialType,
  newMaterialTypeName,
  setNewMaterialTypeName,
}) => {
  return (
    <Card className="mb-4">
      <Card.Header as="h2">Gestion des Types de Matériel</Card.Header>
      <Card.Body>
        <Form onSubmit={handleMaterialTypeSubmit} className="mb-4">
          <Card>
            <Card.Header as="h3">{editingMaterialTypeId ? 'Modifier le type de matériel' : 'Ajouter un type de matériel'}</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Nom du type:</Form.Label>
                <Form.Control type="text" value={newMaterialTypeName} onChange={e => setNewMaterialTypeName(e.target.value)} required />
              </Form.Group>
              <Button variant="primary" type="submit">{editingMaterialTypeId ? 'Modifier' : 'Ajouter'}</Button>
              {editingMaterialTypeId && (
                <Button variant="secondary" onClick={handleCancelEditMaterialType} className="ms-2">Annuler</Button>
              )}
            </Card.Body>
          </Card>
        </Form>

        <Card>
          <Card.Header as="h3">Liste des types de matériel</Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nom du type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materialTypes.map(type => (
                  <tr key={type.id}>
                    <td>{type.name}</td>
                    <td>
                      <Button variant="warning" size="sm" onClick={() => handleEditMaterialType(type)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteMaterialType(type.id)} className="ms-2">Supprimer</Button>
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

export default MaterialTypes;
