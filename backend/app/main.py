from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes, mcp

app = FastAPI(title="GlowOS API", version="0.1.0")

# Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")
app.include_router(mcp.router, prefix="/api/mcp")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
