
import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import DirectRequestModal from '../components/DirectRequestModal';
import AddToCartModal from '../components/AddToCartModal';
import { Container, Accordion } from 'react-bootstrap';

import Materiel from '../components/home/Materiel';
import Localisations from '../components/home/Localisations';
import Users from '../components/home/Users';
import MaterialTypes from '../components/home/MaterialTypes';

const Home = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserUsername, setCurrentUserUsername] = useState('');

  const [materiels, setMateriels] = useState([]);
  const [typeMateriel, setTypeMateriel] = useState(''); // This will be replaced by material_type_id
  const [referenceInterne, setReferenceInterne] = useState('');
  const [selectedLocalisationId, setSelectedLocalisationId] = useState('');
  const [editingMaterielId, setEditingMaterielId] = useState(null);
  const [materielSearchQuery, setMaterielSearchQuery] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [dateReprise, setDateReprise] = useState('');
  const [selectedMaterialOwnerId, setSelectedMaterialOwnerId] = useState(''); // For admin to assign material owner
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState(''); // For selecting material type

  const [localisations, setLocalisations] = useState([]);
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [secteur, setSecteur] = useState('');
  const [numeroChambre, setNumeroChambre] = useState('');
  const [nomCompletResident, setNomCompletResident] = useState('');
  const [editingLocalisationId, setEditingLocalisationId] = useState(null);
  const [localisationSearchQuery, setLocalisationSearchQuery] = useState('');

  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(''); // New state for admin's user selection

  const [materialTypes, setMaterialTypes] = useState([]); // New state for material types
  const [newMaterialTypeName, setNewMaterialTypeName] = useState(''); // For creating new material type
  const [editingMaterialTypeId, setEditingMaterialTypeId] = useState(null); // For editing material type

  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showDirectRequestModal, setShowDirectRequestModal] = useState(false);
  const [selectedMaterielForCart, setSelectedMaterielForCart] = useState(null);

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
      setCurrentUserUsername('');
    }
    return response;
  };

  const fetchMateriels = () => {
    if (!token) return;
    let url = 'http://localhost:8000/materiels/';
    if (materielSearchQuery) {
      url += `?search_query=${encodeURIComponent(materielSearchQuery)}`;
    }
    fetchWithAuth(url)
      .then(response => response.json())
      .then(data => setMateriels(data))
      .catch(error => console.error("Erreur lors de la récupération des matériels:", error));
  };

  const fetchLocalisations = () => {
    if (!token) return;
    let url = 'http://localhost:8000/localisations/';
    if (localisationSearchQuery) {
      url += `?search_query=${encodeURIComponent(localisationSearchQuery)}`;
    }
    fetchWithAuth(url)
      .then(response => response.json())
      .then(data => setLocalisations(data))
      .catch(error => console.error("Erreur lors de la récupération des localisations:", error));
  };

  const fetchUsers = () => {
    if (!token || !isAdmin) return;
    fetchWithAuth('http://localhost:8000/users/')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error("Erreur lors de la récupération des utilisateurs:", error));
  };

  const fetchMaterialTypes = () => {
    if (!token) return;
    fetchWithAuth('http://localhost:8000/material_types/')
      .then(response => response.json())
      .then(data => setMaterialTypes(data))
      .catch(error => console.error("Erreur lors de la récupération des types de matériel:", error));
  };

  useEffect(() => {
    if (token) {
      // Decode token immediately after successful login to set isAdmin status
      try {
        const decodedToken = jwtDecode(token);
        setIsAdmin(decodedToken.is_admin || false);
      } catch (error) {
        console.error("Erreur de décodage du token:", error);
        setToken('');
        localStorage.removeItem('token');
        setIsAdmin(false); // Ensure isAdmin is false if token is invalid
      }

      fetchMateriels();
      fetchLocalisations();
      fetchMaterialTypes(); // Fetch material types for all authenticated users
      fetchWithAuth('http://localhost:8000/users/me/')
        .then(response => response.json())
        .then(data => {
          setCurrentUserUsername(data.username);
        })
        .catch(error => console.error("Erreur lors de la récupération de l'utilisateur courant:", error));
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchUsers();
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (token) {
      fetchMateriels();
    }
  }, [materielSearchQuery, token]);

  useEffect(() => {
    if (token) {
      fetchLocalisations();
    }
  }, [localisationSearchQuery, token]);

  const handleMaterielSubmit = (event) => {
    event.preventDefault();
    const materielData = {
      material_type_id: selectedMaterialTypeId ? parseInt(selectedMaterialTypeId) : null, // Use material_type_id
      reference_interne: referenceInterne,
      localisation_id: selectedLocalisationId ? parseInt(selectedLocalisationId) : null,
      date_livraison: dateLivraison || null,
      date_reprise: dateReprise || null,
      owner_id: isAdmin && selectedMaterialOwnerId ? parseInt(selectedMaterialOwnerId) : undefined, // Only send if admin and selected
    };

    if (editingMaterielId) {
      // Update existing materiel
      fetchWithAuth(`http://localhost:8000/materiels/${editingMaterielId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(materielData),
        }
      )
        .then(response => response.json())
        .then(() => {
          fetchMateriels();
          setTypeMateriel(''); // Clear old type_materiel state
          setReferenceInterne('');
          setSelectedLocalisationId('');
          setDateLivraison('');
          setDateReprise('');
          setEditingMaterielId(null);
          setSelectedMaterialOwnerId('');
          setSelectedMaterialTypeId(''); // Clear material type selection
        })
        .catch(error => console.error("Erreur lors de la mise à jour du matériel:", error));
    } else {
      // Create new materiel
      fetchWithAuth('http://localhost:8000/materiels/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materielData),
      })
        .then(response => response.json())
        .then(() => {
          fetchMateriels();
          setTypeMateriel(''); // Clear old type_materiel state
          setReferenceInterne('');
          setSelectedLocalisationId('');
          setDateLivraison('');
          setDateReprise('');
          setSelectedMaterialTypeId(''); // Clear material type selection
        })
        .catch(error => console.error("Erreur lors de l'ajout du matériel:", error));
    }
  };

  const handleEditMateriel = (materiel) => {
    // typeMateriel is now material_type.name
    setTypeMateriel(materiel.material_type ? materiel.material_type.name : '');
    setSelectedMaterialTypeId(materiel.material_type ? materiel.material_type.id : '');
    setReferenceInterne(materiel.reference_interne);
    setSelectedLocalisationId(materiel.localisation ? materiel.localisation.id : '');
    setDateLivraison(materiel.date_livraison ? materiel.date_livraison.split('T')[0] : '');
    setDateReprise(materiel.date_reprise ? materiel.date_reprise.split('T')[0] : '');
    setSelectedMaterialOwnerId(materiel.owner_id || ''); // Load owner_id for editing
    setEditingMaterielId(materiel.id);
  };

  const handleCancelEditMateriel = () => {
    setTypeMateriel('');
    setReferenceInterne('');
    setSelectedLocalisationId('');
    setDateLivraison('');
    setDateReprise('');
    setSelectedMaterialOwnerId('');
    setSelectedMaterialTypeId('');
    setEditingMaterielId(null);
  };

  const handleDeleteMateriel = (id) => {
    fetchWithAuth(`http://localhost:8000/materiels/${id}`,
      {
        method: 'DELETE',
      }
    )
      .then(() => {
        fetchMateriels();
      })
      .catch(error => console.error("Erreur lors de la suppression du matériel:", error));
  };

  const handleLocalisationSubmit = (event) => {
    event.preventDefault();

    const localisationData = {
      secteur,
      numero_chambre: numeroChambre,
      nom_complet_resident: nomCompletResident,
      nom_etablissement: '', // Initialize to empty string
      owner_id: null, // Initialize to null
    };

    console.log("Current selectedUserId:", selectedUserId);
    console.log("Current users array:", users);

    if (isAdmin) {
      if (selectedUserId) {
        localisationData.owner_id = parseInt(selectedUserId);
        const selectedUser = users.find(user => user.id === parseInt(selectedUserId));
        if (selectedUser && typeof selectedUser.username === 'string' && selectedUser.username.length > 0) {
          localisationData.nom_etablissement = selectedUser.username;
        } else {
          console.error("Admin: Nom d'utilisateur sélectionné invalide ou introuvable. selectedUser:", selectedUser);
          return;
        }
      } else {
        console.error("Admin: Veuillez sélectionner un propriétaire pour la localisation.");
        return;
      }
    } else {
      // For non-admin, nom_etablissement is currentUserUsername and owner_id is handled by backend
      localisationData.nom_etablissement = currentUserUsername;
      // owner_id is not sent by non-admins, backend uses current_user.id
    }

    console.log("Localisation data being sent:", localisationData);

    if (editingLocalisationId) {
      // Update existing localisation
      fetchWithAuth(`http://localhost:8000/localisations/${editingLocalisationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localisationData),
        }
      )
        .then(response => response.json())
        .then(() => {
          fetchLocalisations();
          setNomEtablissement('');
          setSecteur('');
          setNumeroChambre('');
          setNomCompletResident('');
          setEditingLocalisationId(null);
          setSelectedUserId('');
        })
        .catch(error => console.error("Erreur lors de la mise à jour de la localisation:", error));
    } else {
      // Create new localisation
      fetchWithAuth('http://localhost:8000/localisations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localisationData),
      })
        .then(response => response.json())
        .then(() => {
          fetchLocalisations();
          setNomEtablissement('');
          setSecteur('');
          setNumeroChambre('');
          setNomCompletResident('');
        })
        .catch(error => console.error("Erreur lors de l'ajout de la localisation:", error));
    }
  };

  const handleEditLocalisation = (localisation) => {
    setNomEtablissement(localisation.nom_etablissement);
    setSecteur(localisation.secteur);
    setNumeroChambre(localisation.numero_chambre);
    setNomCompletResident(localisation.nom_complet_resident);
    setEditingLocalisationId(localisation.id);
    setSelectedUserId(localisation.owner_id || '');
  };

  const handleCancelEditLocalisation = () => {
    setNomEtablissement('');
    setSecteur('');
    setNumeroChambre('');
    setNomCompletResident('');
    setEditingLocalisationId(null);
    setSelectedUserId('');
  };

  const handleDeleteLocalisation = (id) => {
    fetchWithAuth(`http://localhost:8000/localisations/${id}`,
      {
        method: 'DELETE',
      }
    )
      .then(() => {
        fetchLocalisations();
        fetchMateriels();
      })
      .catch(error => console.error("Erreur lors de la suppression de la localisation:", error));
  };

  const handleCreateUser = (event) => {
    event.preventDefault();
    const userData = {
      username: newUsername,
      password: newPassword,
      is_admin: newUserIsAdmin,
    };

    fetchWithAuth('http://localhost:8000/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
      .then(response => response.json())
      .then(() => {
        fetchUsers();
        setNewUsername('');
        setNewPassword('');
        setNewUserIsAdmin(false);
      })
      .catch(error => console.error("Erreur lors de la création de l'utilisateur:", error));
  };

  const handleDeleteUser = (id) => {
    fetchWithAuth(`http://localhost:8000/users/${id}`,
      {
        method: 'DELETE',
      }
    )
      .then(() => {
        fetchUsers();
        fetchMateriels(); // Refresh materiels and localisations in case they were detached
        fetchLocalisations();
      })
      .catch(error => console.error("Erreur lors de la suppression de l'utilisateur:", error));
  };

  const handleMaterialTypeSubmit = (event) => {
    event.preventDefault();
    const materialTypeData = {
      name: newMaterialTypeName,
    };

    if (editingMaterialTypeId) {
      fetchWithAuth(`http://localhost:8000/material_types/${editingMaterialTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialTypeData),
      })
        .then(response => response.json())
        .then(() => {
          fetchMaterialTypes();
          setNewMaterialTypeName('');
          setEditingMaterialTypeId(null);
        })
        .catch(error => console.error("Erreur lors de la mise à jour du type de matériel:", error));
    } else {
      fetchWithAuth('http://localhost:8000/material_types/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialTypeData),
      })
        .then(response => response.json())
        .then(() => {
          fetchMaterialTypes();
          setNewMaterialTypeName('');
        })
        .catch(error => console.error("Erreur lors de l'ajout du type de matériel:", error));
    }
  };

  const handleEditMaterialType = (materialType) => {
    setNewMaterialTypeName(materialType.name);
    setEditingMaterialTypeId(materialType.id);
  };

  const handleCancelEditMaterialType = () => {
    setNewMaterialTypeName('');
    setEditingMaterialTypeId(null);
  };

  const handleDeleteMaterialType = (id) => {
    fetchWithAuth(`http://localhost:8000/material_types/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        fetchMaterialTypes();
        fetchMateriels(); // Refresh materiels in case a linked type was deleted
      })
      .catch(error => console.error("Erreur lors de la suppression du type de matériel:", error));
  };

  const handleDirectRequest = (materiel) => {
    setSelectedMaterielForCart(materiel);
    setShowDirectRequestModal(true);
  };

  const handleAddToCart = (materiel) => {
    setSelectedMaterielForCart(materiel);
    setShowAddToCartModal(true);
  };

  const handleCloseModal = () => {
    setShowAddToCartModal(false);
    setShowDirectRequestModal(false); // Also close the direct request modal
    setSelectedMaterielForCart(null);
  };

  const handleConfirmAddToCart = (materielId, requestType, description) => {
    const cartItemData = {
      materiel_id: materielId,
      request_type: requestType,
      description: description,
    };

    fetchWithAuth('http://localhost:8000/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartItemData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        alert("Matériel ajouté au panier !");
        // Optionally, refresh cart count here if we implement it
      })
      .catch(error => console.error("Erreur lors de l'ajout au panier:", error));
  };

  const handleConfirmDirectRequest = (materielId, requestType, description) => {
    const requestData = {
      materiel_id: materielId,
      request_type: requestType,
      description: description,
    };

    fetchWithAuth('http://localhost:8000/requests/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        alert("Demande directe créée avec succès !");
      })
      .catch(error => console.error("Erreur lors de la création de la demande directe:", error));
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Gestion de Matériel Médical</h1>

      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Gestion du Matériel</Accordion.Header>
          <Accordion.Body>
            <Materiel
              materiels={materiels}
              editingMaterielId={editingMaterielId}
              handleMaterielSubmit={handleMaterielSubmit}
              handleEditMateriel={handleEditMateriel}
              handleCancelEditMateriel={handleCancelEditMateriel}
              handleDeleteMateriel={handleDeleteMateriel}
              handleAddToCart={handleAddToCart}
              handleDirectRequest={handleDirectRequest}
              materielSearchQuery={materielSearchQuery}
              setMaterielSearchQuery={setMaterielSearchQuery}
              selectedMaterialTypeId={selectedMaterialTypeId}
              setSelectedMaterialTypeId={setSelectedMaterialTypeId}
              materialTypes={materialTypes}
              referenceInterne={referenceInterne}
              setReferenceInterne={setReferenceInterne}
              selectedLocalisationId={selectedLocalisationId}
              setSelectedLocalisationId={setSelectedLocalisationId}
              localisations={localisations}
              isAdmin={isAdmin}
              selectedMaterialOwnerId={selectedMaterialOwnerId}
              setSelectedMaterialOwnerId={setSelectedMaterialOwnerId}
              users={users}
              dateLivraison={dateLivraison}
              setDateLivraison={setDateLivraison}
              dateReprise={dateReprise}
              setDateReprise={setDateReprise}
            />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>Gestion des Localisations</Accordion.Header>
          <Accordion.Body>
            <Localisations
              localisations={localisations}
              editingLocalisationId={editingLocalisationId}
              handleLocalisationSubmit={handleLocalisationSubmit}
              handleEditLocalisation={handleEditLocalisation}
              handleCancelEditLocalisation={handleCancelEditLocalisation}
              handleDeleteLocalisation={handleDeleteLocalisation}
              localisationSearchQuery={localisationSearchQuery}
              setLocalisationSearchQuery={setLocalisationSearchQuery}
              isAdmin={isAdmin}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              users={users}
              currentUserUsername={currentUserUsername}
              secteur={secteur}
              setSecteur={setSecteur}
              numeroChambre={numeroChambre}
              setNumeroChambre={setNumeroChambre}
              nomCompletResident={nomCompletResident}
              setNomCompletResident={setNomCompletResident}
            />
          </Accordion.Body>
        </Accordion.Item>

        {isAdmin && (
          <>
            <Accordion.Item eventKey="2">
              <Accordion.Header>Gestion des Utilisateurs</Accordion.Header>
              <Accordion.Body>
                <Users
                  users={users}
                  handleCreateUser={handleCreateUser}
                  handleDeleteUser={handleDeleteUser}
                  newUsername={newUsername}
                  setNewUsername={setNewUsername}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  newUserIsAdmin={newUserIsAdmin}
                  setNewUserIsAdmin={setNewUserIsAdmin}
                />
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3">
              <Accordion.Header>Gestion des Types de Matériel</Accordion.Header>
              <Accordion.Body>
                <MaterialTypes
                  materialTypes={materialTypes}
                  editingMaterialTypeId={editingMaterialTypeId}
                  handleMaterialTypeSubmit={handleMaterialTypeSubmit}
                  handleEditMaterialType={handleEditMaterialType}
                  handleCancelEditMaterialType={handleCancelEditMaterialType}
                  handleDeleteMaterialType={handleDeleteMaterialType}
                  newMaterialTypeName={newMaterialTypeName}
                  setNewMaterialTypeName={setNewMaterialTypeName}
                />
              </Accordion.Body>
            </Accordion.Item>
          </>
        )}
      </Accordion>

      {showAddToCartModal && (
        <AddToCartModal
          materiel={selectedMaterielForCart}
          onClose={handleCloseModal}
          onAddToCart={handleConfirmAddToCart}
        />
      )}

      {showDirectRequestModal && (
        <DirectRequestModal
          materiel={selectedMaterielForCart}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDirectRequest}
        />
      )}
    </Container>
  );
}

export default Home;
