import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    is_vercel = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
    if is_vercel:
        # Vercel serverless functions have a read-only filesystem except /tmp
        tmp_db = Path("/tmp/samhita.db")
        backend_dir = Path(__file__).resolve().parent.parent.parent
        bundled_db = backend_dir / "samhita.db"
        if not bundled_db.exists():
            bundled_db = backend_dir.parent / "samhita.db"
        
        if not tmp_db.exists() and bundled_db.exists():
            try:
                shutil.copy2(bundled_db, tmp_db)
            except Exception as e:
                print(f"Notice: Could not copy bundled samhita.db to /tmp: {e}")

        DATABASE_URL = f"sqlite:///{tmp_db.as_posix()}"
    else:
        # Local development: resolve samhita.db location reliably
        backend_dir = Path(__file__).resolve().parent.parent.parent
        root_db = backend_dir.parent / "samhita.db"
        backend_db = backend_dir / "samhita.db"
        
        if root_db.exists():
            target_db = root_db
        elif backend_db.exists():
            target_db = backend_db
        else:
            target_db = root_db

        DATABASE_URL = f"sqlite:///{target_db.as_posix()}"

# SQLite needs connect_args check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
