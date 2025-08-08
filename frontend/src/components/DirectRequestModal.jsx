import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const DirectRequestModal = ({ materiel, onClose, onConfirm }) => {
  const [requestType, setRequestType] = useState('LIVRAISON');
  const [description, setDescription] = useState('');

  if (!materiel) return null;

  const handleSubmit = () => {
    onConfirm(materiel.id, requestType, description);
    onClose();
  };

  return (
    <Modal show onHide={onClose} centered data-bs-theme="dark">
      <Modal.Header closeButton>
        <Modal.Title>Créer une demande directe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Matériel :</strong> {materiel.reference_interne || 'N/A'}</p>
        <p><strong>Propriétaire :</strong> {materiel.owner ? materiel.owner.username : 'Non assigné'}</p>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Type de demande</Form.Label>
            <Form.Select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
            >
              <option value="LIVRAISON">Livraison</option>
              <option value="REPRISE">Reprise</option>
              <option value="DEPANNAGE">Dépannage</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSubmit}>Confirmer la demande</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DirectRequestModal;
