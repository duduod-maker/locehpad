
import React from 'react';
import { Form, Button, Card, Table, Row, Col } from 'react-bootstrap';

const Users = ({
  users,
  handleCreateUser,
  handleDeleteUser,
  newUsername,
  setNewUsername,
  newPassword,
  setNewPassword,
  newUserIsAdmin,
  setNewUserIsAdmin,
}) => {
  return (
    <Card className="mb-4">
      <Card.Header as="h2">Gestion des Utilisateurs</Card.Header>
      <Card.Body>
        <Form onSubmit={handleCreateUser} className="mb-4">
          <Card>
            <Card.Header as="h3">Créer un nouvel utilisateur</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Nom d'utilisateur:</Form.Label>
                <Form.Control type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe:</Form.Label>
                <Form.Control type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Est administrateur"
                  checked={newUserIsAdmin}
                  onChange={e => setNewUserIsAdmin(e.target.checked)}
                />
              </Form.Group>
              <Button variant="primary" type="submit">Créer utilisateur</Button>
            </Card.Body>
          </Card>
        </Form>

        <Card>
          <Card.Header as="h3">Liste des utilisateurs</Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.is_admin ? 'Admin' : 'Utilisateur'}</td>
                    <td>
                      {user.id !== 1 && ( // Prevent deleting the first admin user (ID 1)
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>Supprimer</Button>
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

export default Users;
