from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, func, Enum
from sqlalchemy.orm import relationship, declarative_base
import enum
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class RequestType(enum.Enum):
    LIVRAISON = "LIVRAISON"
    REPRISE = "REPRISE"
    DEPANNAGE = "DEPANNAGE"

class RequestStatus(enum.Enum):
    EN_ATTENTE = "EN ATTENTE"
    PRISE_EN_COMPTE = "PRISE EN COMPTE"
    EN_COURS_DE_REALISATION = "EN COURS DE REALISATION"
    TERMINEE = "TERMINEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

    materiels = relationship("Materiel", back_populates="owner")
    localisations = relationship("Localisation", back_populates="owner")
    requests = relationship("Request", back_populates="user")
    cart = relationship("Cart", uselist=False, back_populates="user")

class MaterialType(Base):
    __tablename__ = "material_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    materiels = relationship("Materiel", back_populates="material_type")

class Materiel(Base):
    __tablename__ = "materiels"

    id = Column(Integer, primary_key=True, index=True)
    material_type_id = Column(Integer, ForeignKey("material_types.id"))
    reference_interne = Column(String, index=True, nullable=True)
    localisation_id = Column(Integer, ForeignKey("localisations.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    date_livraison = Column(DateTime, nullable=True)
    date_reprise = Column(DateTime, nullable=True)

    material_type = relationship("MaterialType", back_populates="materiels")
    localisation = relationship("Localisation", back_populates="materiels")
    owner = relationship("User", back_populates="materiels")
    requests = relationship("Request", back_populates="materiel", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="materiel", cascade="all, delete-orphan")

class Localisation(Base):
    __tablename__ = "localisations"

    id = Column(Integer, primary_key=True, index=True)
    nom_etablissement = Column(String)
    secteur = Column(String)
    numero_chambre = Column(String)
    nom_complet_resident = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    materiels = relationship("Materiel", back_populates="localisation")
    owner = relationship("User", back_populates="localisations")

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, default=generate_uuid, index=True)
    materiel_id = Column(Integer, ForeignKey("materiels.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    request_type = Column(Enum(RequestType), nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.EN_ATTENTE, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    materiel = relationship("Materiel", back_populates="requests")
    user = relationship("User", back_populates="requests")

class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    materiel_id = Column(Integer, ForeignKey("materiels.id"))
    request_type = Column(Enum(RequestType), nullable=False)
    description = Column(String, nullable=True)
    
    cart = relationship("Cart", back_populates="items")
    materiel = relationship("Materiel", back_populates="cart_items")