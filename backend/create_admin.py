import sys
import os
from getpass import getpass

# Add the current directory to the path to allow imports from sibling files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Base
from main import get_password_hash

def create_admin_user():
    """
    Creates the initial admin user from the command line.
    """
    # Ensure all tables are created, especially if run on a fresh DB
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    print("--- Création du compte administrateur ---")

    try:
        # Check if an admin already exists to prevent creating multiple admins this way
        if db.query(User).filter(User.is_admin == True).first():
            print("Un compte administrateur existe déjà.")
            db.close()
            return

        # Get username from input
        username = input("Entrez le nom d'utilisateur de l'administrateur: ")
        if not username:
            print("Le nom d'utilisateur ne peut pas être vide.")
            return

        # Check if that specific username already exists
        if db.query(User).filter(User.username == username).first():
            print(f"L'utilisateur '{username}' existe déjà.")
            return

        # Get password using getpass for privacy
        password = getpass("Entrez le mot de passe de l'administrateur: ")
        if not password:
            print("Le mot de passe ne peut pas être vide.")
            return
        
        password_confirm = getpass("Confirmez le mot de passe: ")
        if password != password_confirm:
            print("Les mots de passe ne correspondent pas.")
            return

        # Hash the password and create the user object
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            hashed_password=hashed_password,
            is_admin=True
        )

        db.add(admin_user)
        db.commit()

        print(f"\nCompte administrateur '{username}' créé avec succès !")

    except Exception as e:
        db.rollback()
        print(f"Une erreur est survenue lors de la création de l'utilisateur: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
