from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import RequestType, RequestStatus

# Pydantic model for creating a MaterialType (request)
class MaterialTypeCreate(BaseModel):
    name: str

# Pydantic model for reading a MaterialType (response)
class MaterialType(MaterialTypeCreate):
    id: int

    class Config:
        from_attributes = True

# Pydantic model for creating a Localisation (request)
class LocalisationCreate(BaseModel):
    nom_etablissement: str
    secteur: str
    numero_chambre: str
    nom_complet_resident: str
    owner_id: Optional[int] = None

# Pydantic model for reading a Localisation (response)
class Localisation(LocalisationCreate):
    id: int

    class Config:
        from_attributes = True

# Pydantic model for creating a Materiel (request)
class MaterielCreate(BaseModel):
    material_type_id: int
    reference_interne: Optional[str] = None
    localisation_id: Optional[int] = None
    date_livraison: Optional[datetime] = None
    date_reprise: Optional[datetime] = None
    owner_id: Optional[int] = None

# Pydantic model for reading a Materiel (response)
class Materiel(BaseModel):
    id: int
    owner_id: Optional[int] = None
    material_type: Optional[MaterialType] = None # Changed from type_materiel
    reference_interne: str
    localisation: Optional[Localisation] = None
    date_livraison: Optional[datetime] = None
    date_reprise: Optional[datetime] = None

    class Config:
        from_attributes = True

# Pydantic model for creating a User (request)
class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: Optional[bool] = False

# Pydantic model for reading a User (response)
class User(BaseModel):
    id: int
    username: str
    is_admin: bool
    materiels: List["Materiel"] = []
    localisations: List[Localisation] = []

    class Config:
        from_attributes = True

# Pydantic model for JWT token data
class TokenData(BaseModel):
    username: str | None = None

# Pydantic model for JWT token response
class Token(BaseModel):
    access_token: str
    token_type: str

# Pydantic model for creating a direct Request (request)
class DirectRequestCreate(BaseModel):
    materiel_id: int
    request_type: RequestType
    description: Optional[str] = None

# Pydantic model for creating a Request (request)
class RequestCreate(BaseModel):
    materiel_id: int
    request_type: RequestType
    description: Optional[str] = None

# Pydantic model for updating a Request (request)
class RequestUpdate(BaseModel):
    status: RequestStatus

# Pydantic model for reading a Request (response)
class Request(BaseModel):
    id: int
    batch_id: str
    materiel_id: Optional[int] = None
    user_id: int
    request_type: RequestType
    status: RequestStatus
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    materiel: Optional[Materiel] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

# Pydantic model for creating a CartItem (request)
class CartItemCreate(BaseModel):
    materiel_id: int
    request_type: RequestType
    description: Optional[str] = None

# Pydantic model for reading a CartItem (response)
class CartItem(CartItemCreate):
    id: int
    cart_id: int
    materiel: Materiel

    class Config:
        from_attributes = True

# Pydantic model for reading a Cart (response)
class Cart(BaseModel):
    id: int
    user_id: int
    items: List[CartItem] = []

    class Config:
        from_attributes = True
