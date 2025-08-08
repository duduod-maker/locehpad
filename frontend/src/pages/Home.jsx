
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from '../config';

const Home = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [materiels, setMateriels] = useState([]);
  const [localisations, setLocalisations] = useState([]);
  const [users, setUsers] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);

  const [showDirectRequestModal, setShowDirectRequestModal] = useState(false);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [selectedMateriel, setSelectedMateriel] = useState(null);

  const [editingMaterielId, setEditingMaterielId] = useState(null);
  const [newMateriel, setNewMateriel] = useState({
    reference_interne: '',
    material_type_id: '',
    localisation_id: '',
    date_livraison: '',
    date_reprise: '',
  });

  const [editingLocalisationId, setEditingLocalisationId] = useState(null);
  const [newLocalisation, setNewLocalisation] = useState({
    nom_etablissement: '',
    secteur: '',
    numero_chambre: '',
    nom_complet_resident: '',
  });

  const [editingMaterialTypeId, setEditingMaterialTypeId] = useState(null);
  const [newMaterialType, setNewMaterialType] = useState({
    name: '',
  });

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

  const fetchMateriels = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/materiels/`)
      .then(response => response.json())
      .then(data => setMateriels(data))
      .catch(error => console.error("Erreur lors de la récupération des matériels:", error));
  };

  const fetchLocalisations = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/localisations/`)
      .then(response => response.json())
      .then(data => setLocalisations(data))
      .catch(error => console.error("Erreur lors de la récupération des localisations:", error));
  };

  const fetchUsers = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/users/`)
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error("Erreur lors de la récupération des utilisateurs:", error));
  };

  const fetchMaterialTypes = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/material_types/`)
      .then(response => response.json())
      .then(data => setMaterialTypes(data))
      .catch(error => console.error("Erreur lors de la récupération des types de matériel:", error));
  };

  const fetchCurrentUser = () => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/users/me/`)
      .then(response => response.json())
      .then(data => {
        // Optionally handle current user data
      })
      .catch(error => console.error("Erreur lors de la récupération de l'utilisateur actuel:", error));
  };

  const handleMaterielSubmit = (event) => {
    event.preventDefault();
    if (!token) return;

    if (editingMaterielId) {
      // Update existing materiel
      fetchWithAuth(`${API_BASE_URL}/materiels/${editingMaterielId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMateriel),
      })
        .then(response => {
          if (response.ok) {
            setEditingMaterielId(null);
            setNewMateriel({
              reference_interne: '',
              material_type_id: '',
              localisation_id: '',
              date_livraison: '',
              date_reprise: '',
            });
            fetchMateriels();
          } else {
            console.error("Erreur lors de la mise à jour du matériel");
          }
        })
        .catch(error => console.error("Erreur lors de la mise à jour du matériel:", error));
    } else {
      // Create new materiel
      fetchWithAuth(`${API_BASE_URL}/materiels/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMateriel),
      })
        .then(response => {
          if (response.ok) {
            setNewMateriel({
              reference_interne: '',
              material_type_id: '',
              localisation_id: '',
              date_livraison: '',
              date_reprise: '',
            });
            fetchMateriels();
          } else {
            console.error("Erreur lors de la création du matériel");
          }
        })
        .catch(error => console.error("Erreur lors de la création du matériel:", error));
    }
  };

  const handleMaterielDelete = (id) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/materiels/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          fetchMateriels();
        } else {
          console.error("Erreur lors de la suppression du matériel");
        }
      })
      .catch(error => console.error("Erreur lors de la suppression du matériel:", error));
  };

  const handleLocalisationSubmit = (event) => {
    event.preventDefault();
    if (!token) return;

    if (editingLocalisationId) {
      // Update existing localisation
      fetchWithAuth(`${API_BASE_URL}/localisations/${editingLocalisationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocalisation),
      })
        .then(response => {
          if (response.ok) {
            setEditingLocalisationId(null);
            setNewLocalisation({
              nom_etablissement: '',
              secteur: '',
              numero_chambre: '',
              nom_complet_resident: '',
            });
            fetchLocalisations();
          } else {
            console.error("Erreur lors de la mise à jour de la localisation");
          }
        })
        .catch(error => console.error("Erreur lors de la mise à jour de la localisation:", error));
    } else {
      // Create new localisation
      fetchWithAuth(`${API_BASE_URL}/localisations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocalisation),
      })
        .then(response => {
          if (response.ok) {
            setNewLocalisation({
              nom_etablissement: '',
              secteur: '',
              numero_chambre: '',
              nom_complet_resident: '',
            });
            fetchLocalisations();
          } else {
            console.error("Erreur lors de la création de la localisation");
          }
        })
        .catch(error => console.error("Erreur lors de la création de la localisation:", error));
    }
  };

  const handleLocalisationDelete = (id) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/localisations/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          fetchLocalisations();
        } else {
          console.error("Erreur lors de la suppression de la localisation");
        }
      })
      .catch(error => console.error("Erreur lors de la suppression de la localisation:", error));
  };

  const handleUserSubmit = (event) => {
    event.preventDefault();
    if (!token) return;

    // Assuming user creation/update is handled here
    // This is a placeholder, actual implementation depends on your API
    fetchWithAuth(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'newuser', password: 'password' }), // Replace with actual user data
    })
      .then(response => {
        if (response.ok) {
          fetchUsers();
        } else {
          console.error("Erreur lors de la création de l'utilisateur");
        }
      })
      .catch(error => console.error("Erreur lors de la création de l'utilisateur:", error));
  };

  const handleUserDelete = (id) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          fetchUsers();
        } else {
          console.error("Erreur lors de la suppression de l'utilisateur");
        }
      })
      .catch(error => console.error("Erreur lors de la suppression de l'utilisateur:", error));
  };

  const handleMaterialTypeSubmit = (event) => {
    event.preventDefault();
    if (!token) return;

    if (editingMaterialTypeId) {
      // Update existing material type
      fetchWithAuth(`${API_BASE_URL}/material_types/${editingMaterialTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaterialType),
      })
        .then(response => {
          if (response.ok) {
            setEditingMaterialTypeId(null);
            setNewMaterialType({ name: '' });
            fetchMaterialTypes();
          } else {
            console.error("Erreur lors de la mise à jour du type de matériel");
          }
        })
        .catch(error => console.error("Erreur lors de la mise à jour du type de matériel:", error));
    } else {
      // Create new material type
      fetchWithAuth(`${API_BASE_URL}/material_types/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaterialType),
      })
        .then(response => {
          if (response.ok) {
            setNewMaterialType({ name: '' });
            fetchMaterialTypes();
          } else {
            console.error("Erreur lors de la création du type de matériel");
          }
        })
        .catch(error => console.error("Erreur lors de la création du type de matériel:", error));
    }
  };

  const handleMaterialTypeDelete = (id) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/material_types/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          fetchMaterialTypes();
        } else {
          console.error("Erreur lors de la suppression du type de matériel");
        }
      })
      .catch(error => console.error("Erreur lors de la suppression du type de matériel:", error));
  };

  const handleAddToCart = (materielId) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ materiel_id: materielId }),
    })
      .then(response => {
        if (response.ok) {
          alert("Matériel ajouté au panier!");
        } else {
          console.error("Erreur lors de l'ajout au panier");
        }
      })
      .catch(error => console.error("Erreur lors de l'ajout au panier:", error));
  };

  const handleDirectRequest = (materielId, userId) => {
    if (!token) return;
    fetchWithAuth(`${API_BASE_URL}/requests/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ materiel_id: materielId, user_id: userId }),
    })
      .then(response => {
        if (response.ok) {
          alert("Demande directe créée!");
        } else {
          console.error("Erreur lors de la création de la demande directe");
        }
      })
      .catch(error => console.error("Erreur lors de la création de la demande directe:", error));
  };

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setIsAdmin(decodedToken.is_admin || false);
      fetchMateriels();
      fetchLocalisations();
      fetchUsers();
      fetchMaterialTypes();
      fetchCurrentUser();
    }
  }, [token]);

  return (
    <div className="home-page">
      <h1>Accueil</h1>

      {/* Materiels Section */}
      <Materiel
        materiels={materiels}
        localisations={localisations}
        materialTypes={materialTypes}
        handleMaterielDelete={handleMaterielDelete}
        setEditingMaterielId={setEditingMaterielId}
        setNewMateriel={setNewMateriel}
        setShowAddToCartModal={setShowAddToCartModal}
        setSelectedMateriel={setSelectedMateriel}
        setShowDirectRequestModal={setShowDirectRequestModal}
      />

      {/* Localisations Section */}
      {isAdmin && (
        <Localisations
          localisations={localisations}
          handleLocalisationDelete={handleLocalisationDelete}
          setEditingLocalisationId={setEditingLocalisationId}
          setNewLocalisation={setNewLocalisation}
        />
      )}

      {/* Users Section */}
      {isAdmin && (
        <Users
          users={users}
          handleUserDelete={handleUserDelete}
        />
      )}

      {/* Material Types Section */}
      {isAdmin && (
        <MaterialTypes
          materialTypes={materialTypes}
          handleMaterialTypeDelete={handleMaterialTypeDelete}
          setEditingMaterialTypeId={setEditingMaterialTypeId}
          setNewMaterialType={setNewMaterialType}
        />
      )}

      {/* Modals */}
      <AddToCartModal
        show={showAddToCartModal}
        handleClose={() => setShowAddToCartModal(false)}
        materiel={selectedMateriel}
        handleAddToCart={handleAddToCart}
      />

      <DirectRequestModal
        show={showDirectRequestModal}
        handleClose={() => setShowDirectRequestModal(false)}
        materiel={selectedMateriel}
        users={users}
        handleDirectRequest={handleDirectRequest}
      />
    </div>
  );
};

export default Home;
