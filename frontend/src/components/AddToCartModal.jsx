import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { RequestType } from '../models/enums';

const AddToCartModal = ({ materiel, onClose, onAddToCart }) => {
  const [requestType, setRequestType] = useState('LIVRAISON');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddToCart(materiel.id, requestType, description);
    onClose();
  };

  return (
    <Modal show onHide={onClose} centered data-bs-theme="dark">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter au panier : {materiel.reference_interne}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Type de demande:</Form.Label>
            <Form.Select value={requestType} onChange={e => setRequestType(e.target.value)} required>
              {Object.values(RequestType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (optionnel):</Form.Label>
            <Form.Control as="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={handleSubmit}>Ajouter au panier</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddToCartModal;