from datetime import timedelta, datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from dotenv import load_dotenv
import os

import models
import schemas
from database import SessionLocal, engine

# Load .env file
load_dotenv()

# Configuration de la base de données
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuration CORS
origins = [
    "http://localhost:5173",  # L'origine de votre frontend Vite
    "http://localhost:8000",  # L'origine de votre backend
    "https://locehpad-frontend.onrender.com", # L'origine de votre frontend déployé sur Render
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
        allow_headers=["Content-Type", "Authorization"],
)

# Configuration de la sécurité (JWT)
SECRET_KEY = "votre-cle-secrete-super-securisee"  # À changer pour une vraie clé en production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configuration de l'envoi d’e-mails
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS").lower() == "true",
)

# Fonctions utilitaires pour le mot de passe
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Fonctions utilitaires pour les JWT
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dpendance pour obtenir la session de base de donnes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Fonctions d’authentification
def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user: # Assuming 'is_active' field or similar for active users
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l’API de gestion de matriel mdical"}

# --- Endpoints d’authentification et utilisateurs ---

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User, dependencies=[Depends(get_current_admin_user)])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_user = get_user(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/", response_model=List[schemas.User])
async def read_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    users = db.query(models.User).all()
    return users

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouv")
    
    # Empcher un admin de se supprimer lui-mme
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")

    # Dtacher les matriels et localisations lis avant de supprimer l’utilisateur
    db.query(models.Materiel).filter(models.Materiel.owner_id == user_id).update({"owner_id": None})
    db.query(models.Localisation).filter(models.Localisation.owner_id == user_id).update({"owner_id": None})

    db.delete(db_user)
    db.commit()
    return


# --- Endpoints pour les Types de Matriel (protgs par admin) ---

@app.get("/material_types/", response_model=List[schemas.MaterialType])
async def read_material_types(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    material_types = db.query(models.MaterialType).all()
    return material_types

@app.post("/material_types/", response_model=schemas.MaterialType)
async def create_material_type(material_type: schemas.MaterialTypeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_material_type = models.MaterialType(name=material_type.name)
    db.add(db_material_type)
    db.commit()
    db.refresh(db_material_type)
    return db_material_type

@app.put("/material_types/{material_type_id}", response_model=schemas.MaterialType)
async def update_material_type(material_type_id: int, material_type: schemas.MaterialTypeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_material_type = db.query(models.MaterialType).filter(models.MaterialType.id == material_type_id).first()
    if db_material_type is None:
        raise HTTPException(status_code=404, detail="Type de matriel non trouv")
    
    db_material_type.name = material_type.name
    db.commit()
    db.refresh(db_material_type)
    return db_material_type

@app.delete("/material_types/{material_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_type(material_type_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_material_type = db.query(models.MaterialType).filter(models.MaterialType.id == material_type_id).first()
    if db_material_type is None:
        raise HTTPException(status_code=404, detail="Type de matriel non trouv")
    
    # Dtacher les matriels lis avant de supprimer le type de matriel
    db.query(models.Materiel).filter(models.Materiel.material_type_id == material_type_id).update({"material_type_id": None})

    db.delete(db_material_type)
    db.commit()
    return

# --- Endpoints pour le Matriel (protgs et filtrs par utilisateur) ---


@app.get("/materiels/", response_model=List[schemas.Materiel])
def get_materiels(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    search_query: str | None = None,
    material_type_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    start_date_reprise: datetime | None = None,
    end_date_reprise: datetime | None = None
):
    query = db.query(models.Materiel)
    if not current_user.is_admin:
        query = query.filter(models.Materiel.owner_id == current_user.id)

    if search_query:
        query = query.options(joinedload(models.Materiel.material_type), joinedload(models.Materiel.localisation)).filter(
            (models.Materiel.material_type.has(models.MaterialType.name.ilike(f"%{search_query}%"))) |
            (models.Materiel.reference_interne.ilike(f"%{search_query}%")) |
            (models.Materiel.localisation.has(models.Localisation.nom_complet_resident.ilike(f"%{search_query}%"))) |
            (models.Materiel.localisation.has(models.Localisation.secteur.ilike(f"%{search_query}%")))
        )

    if material_type_id:
        query = query.filter(models.Materiel.material_type_id == material_type_id)

    if start_date:
        query = query.filter(models.Materiel.date_livraison >= start_date)

    if end_date:
        query = query.filter(models.Materiel.date_livraison <= end_date)

    if start_date_reprise:
        query = query.filter(models.Materiel.date_reprise >= start_date_reprise)

    if end_date_reprise:
        query = query.filter(models.Materiel.date_reprise <= end_date_reprise)

    materiels = query.options(joinedload(models.Materiel.localisation)).all()
    return materiels

@app.post("/materiels/", response_model=schemas.Materiel)
def create_materiel(materiel: schemas.MaterielCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_materiel = models.Materiel(
        material_type_id=materiel.material_type_id, 
        reference_interne=materiel.reference_interne,
        localisation_id=materiel.localisation_id,
        date_livraison=materiel.date_livraison,
        date_reprise=materiel.date_reprise,
        owner_id=materiel.owner_id if current_user.is_admin and materiel.owner_id is not None else current_user.id
    )
    db.add(db_materiel)
    db.commit()
    db.refresh(db_materiel)
    return db_materiel

@app.put("/materiels/{materiel_id}", response_model=schemas.Materiel)
def update_materiel(materiel_id: int, materiel: schemas.MaterielCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_materiel = db.query(models.Materiel).filter(models.Materiel.id == materiel_id).first()
    if db_materiel is None:
        raise HTTPException(status_code=404, detail="Matériel non trouvé")

    # Check permissions
    if not current_user.is_admin and db_materiel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'avez pas la permission de modifier ce matériel")

    # Update fields
    db_materiel.material_type_id = materiel.material_type_id
    db_materiel.reference_interne = materiel.reference_interne
    db_materiel.localisation_id = materiel.localisation_id
    db_materiel.date_livraison = materiel.date_livraison
    db_materiel.date_reprise = materiel.date_reprise

    # Admin can change the owner
    if current_user.is_admin:
        db_materiel.owner_id = materiel.owner_id
    
    db.commit()
    db.refresh(db_materiel)
    return db_materiel

@app.delete("/materiels/{materiel_id}", status_code=status.HTTP_204_NO_CONTENT)

def delete_materiel(materiel_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_materiel = db.query(models.Materiel).filter(models.Materiel.id == materiel_id).first()

    if db_materiel is None:
        raise HTTPException(status_code=404, detail="Matriel non trouv")

    # Les non-admins ne peuvent supprimer que leur propre matriel
    if not current_user.is_admin and db_materiel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de supprimer ce matriel")

    # La suppression en cascade est gre par la configuration de la relation dans models.py
    db.delete(db_materiel)
    db.commit()
    return

# --- Endpoints pour les Localisations (protgs et filtrs par utilisateur) ---

@app.get("/localisations/", response_model=List[schemas.Localisation])
def get_localisations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user), search_query: str | None = None):
    query = db.query(models.Localisation)
    if not current_user.is_admin:
        query = query.filter(models.Localisation.owner_id == current_user.id)
    if search_query:
        query = query.filter(
            (models.Localisation.nom_etablissement.ilike(f"%{search_query}%")) |
            (models.Localisation.secteur.ilike(f"%{search_query}%")) |
            (models.Localisation.numero_chambre.ilike(f"%{search_query}%")) |
            (models.Localisation.nom_complet_resident.ilike(f"%{search_query}%"))
        )
    localisations = query.all()
    return localisations

@app.post("/localisations/", response_model=schemas.Localisation)
def create_localisation(localisation: schemas.LocalisationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.is_admin and localisation.owner_id is not None:
        # If admin provides an owner_id, verify that user exists
        owner_user = db.query(models.User).filter(models.User.id == localisation.owner_id).first()
        if not owner_user:
            raise HTTPException(status_code=404, detail="Propritaire spcifi non trouv.")
        final_owner_id = localisation.owner_id
    else:
        # For non-admins, or admins not specifying an owner_id, use the current user's ID
        final_owner_id = current_user.id

    db_localisation = models.Localisation(
        nom_etablissement=localisation.nom_etablissement, 
        secteur=localisation.secteur, 
        numero_chambre=localisation.numero_chambre, 
        nom_complet_resident=localisation.nom_complet_resident,
        owner_id=final_owner_id
    )
    db.add(db_localisation)
    db.commit()
    db.refresh(db_localisation)
    return db_localisation

@app.put("/localisations/{localisation_id}", response_model=schemas.Localisation)
def update_localisation(localisation_id: int, localisation: schemas.LocalisationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_localisation = db.query(models.Localisation).filter(models.Localisation.id == localisation_id).first()
    if db_localisation is None:
        raise HTTPException(status_code=404, detail="Localisation non trouv")
    
    # Vrifier les permissions
    if not current_user.is_admin and db_localisation.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de modifier cette localisation")

    db_localisation.nom_etablissement = localisation.nom_etablissement
    db_localisation.secteur = localisation.secteur
    db_localisation.numero_chambre = localisation.numero_chambre
    db_localisation.nom_complet_resident = localisation.nom_complet_resident
    
    # Permettre  l’admin de changer le propritaire
    if current_user.is_admin and localisation.owner_id is not None:
        db_localisation.owner_id = localisation.owner_id

    db.commit()
    db.refresh(db_localisation)
    return db_localisation

@app.delete("/localisations/{localisation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_localisation(localisation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_localisation = db.query(models.Localisation).filter(models.Localisation.id == localisation_id, models.Localisation.owner_id == current_user.id).first()
    if db_localisation is None:
        raise HTTPException(status_code=404, detail="Localisation non trouv ou vous n’avez pas la permission")
    
    # Dtacher les matriels lis avant de supprimer la localisation
    db.query(models.Materiel).filter(models.Materiel.localisation_id == localisation_id, models.Materiel.owner_id == current_user.id).update({"localisation_id": None})
    
    db.delete(db_localisation)
    db.commit()
    return

# --- Endpoints pour les Demandes (protgs et filtrs par utilisateur) ---

@app.post("/requests/", response_model=schemas.Request)
def create_request(request: schemas.RequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = models.Request(**request.dict(), user_id=current_user.id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request



@app.get("/requests/{request_id}", response_model=schemas.Request)
def get_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Demande non trouv")
    if not current_user.is_admin and db_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de voir cette demande")
    return db_request

# --- Endpoints pour les Demandes (protgs et filtrs par utilisateur) ---

@app.post("/requests/", response_model=schemas.Request)
def create_request(request: schemas.RequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = models.Request(**request.dict(), user_id=current_user.id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/requests/", response_model=List[schemas.Request])
def get_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    query = db.query(models.Request).options(joinedload(models.Request.materiel)).order_by(models.Request.created_at.desc())
    if not current_user.is_admin:
        query = query.filter(models.Request.user_id == current_user.id)
    return query.all()

@app.get("/requests/{request_id}", response_model=schemas.Request)
def get_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = db.query(models.Request).options(joinedload(models.Request.materiel)).filter(models.Request.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Demande non trouv")
    if not current_user.is_admin and db_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de voir cette demande")
    return db_request

@app.put("/requests/{request_id}", response_model=schemas.Request, dependencies=[Depends(get_current_admin_user)])
def update_request_status(request_id: int, request_update: schemas.RequestUpdate, db: Session = Depends(get_db)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Demande non trouv")
    
    db_request.status = request_update.status
    db.commit()
    db.refresh(db_request)
    return db_request

@app.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Demande non trouv")
    if not current_user.is_admin and db_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de supprimer cette demande")
    
    db.delete(db_request)
    db.commit()
    return

# --- Endpoints pour le Panier ---

@app.get("/cart/", response_model=schemas.Cart)
async def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # The query to get the cart and all related items
    cart = db.query(models.Cart).options(
        joinedload(models.Cart.items)
        .joinedload(models.CartItem.materiel)
        .joinedload(models.Materiel.material_type)
    ).filter(models.Cart.user_id == current_user.id).first()

    # If no cart, create one and return it
    if not cart:
        cart = models.Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        return cart

    # If cart exists, filter its items to remove any with deleted materials
    if cart.items:
        # This check is important. We only want to keep items that have a material linked.
        valid_items = [item for item in cart.items if item.materiel]
        cart.items = valid_items

    return cart

@app.post("/cart/items", response_model=schemas.CartItem)
async def add_item_to_cart(item: schemas.CartItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if not cart:
        cart = models.Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Check if materiel exists
    materiel = db.query(models.Materiel).filter(models.Materiel.id == item.materiel_id).first()
    if not materiel:
        raise HTTPException(status_code=404, detail="Matriel non trouv")

    db_cart_item = models.CartItem(cart_id=cart.id, materiel_id=item.materiel_id, request_type=item.request_type, description=item.description)
    db.add(db_cart_item)
    db.commit()
    db.refresh(db_cart_item)
    return db_cart_item

@app.delete("/cart/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_cart(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Panier non trouv")
    
    db_cart_item = db.query(models.CartItem).filter(models.CartItem.id == item_id, models.CartItem.cart_id == cart.id).first()
    if db_cart_item is None:
        raise HTTPException(status_code=404, detail="Article du panier non trouv")
    
    db.delete(db_cart_item)
    db.commit()
    return

@app.post("/cart/submit", status_code=status.HTTP_200_OK)
async def submit_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Le panier est vide ou non trouv.")

    batch_id = models.generate_uuid()
    requests_created = []
    for item in cart.items:
        db_request = models.Request(
            materiel_id=item.materiel_id,
            user_id=current_user.id,
            request_type=item.request_type,
            description=item.description,
            batch_id=batch_id
        )
        db.add(db_request)
        requests_created.append(db_request)
    
    # Clear cart after submitting
    for item in cart.items:
        db.delete(item)
    db.commit()

    # Send email notification
    email_body = f"""
Nouvelles demandes de matriel de {current_user.username} (Lot: {batch_id}):

"""
    for req in requests_created:
        materiel = db.query(models.Materiel).filter(models.Materiel.id == req.materiel_id).first()
        email_body += f"- Type: {req.request_type.value}, Matriel: {materiel.reference_interne if materiel else 'N/A'}, Description: {req.description or 'Aucune'}\n"

    message = MessageSchema(
        subject="Nouvelles demandes de matriel",
        recipients=["olivierd.sjm@gmail.com"],  # Replace with your desired recipient email
        body=email_body,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {"message": "Demandes soumises et e-mail envoy avec succs !"}


@app.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Demande non trouv")
    if not current_user.is_admin and db_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n’avez pas la permission de supprimer cette demande")
    
    db.delete(db_request)
    db.commit()
    return

@app.post("/requests/direct", response_model=schemas.Request, dependencies=[Depends(get_current_admin_user)])
def create_direct_request(request: schemas.DirectRequestCreate, db: Session = Depends(get_db)):
    # Find the materiel to get the owner
    db_materiel = db.query(models.Materiel).filter(models.Materiel.id == request.materiel_id).first()
    if not db_materiel:
        raise HTTPException(status_code=404, detail="Matriel non trouv")
    if not db_materiel.owner_id:
        raise HTTPException(status_code=400, detail="Le matriel n’a pas de propritaire assign")

    # Create the request
    db_request = models.Request(
        materiel_id=request.materiel_id,
        user_id=db_materiel.owner_id,
        request_type=request.request_type,
        description=request.description,
        batch_id=models.generate_uuid()  # Generate a unique batch_id for this single request
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request