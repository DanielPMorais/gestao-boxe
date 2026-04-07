from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine, Base
import app.models.domain  # importa para registrar no metadata do SQLAlchemy
from app.api.endpoints import checkin, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas do banco no startup (MVP dia zero)
    # Num cenário ideal deve-se usar Alembic migrations
    Base.metadata.create_all(bind=engine)
    yield
    # Lógica de shutdown (se houver)

app = FastAPI(title="GestaoBoxe API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do GestaoBoxe! Base de dados sincronizada."}

# Registrar rotas
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(checkin.router, prefix="/api/checkins", tags=["Checkins"])
