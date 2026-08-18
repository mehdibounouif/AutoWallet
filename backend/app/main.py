
from fastapi import FastAPI

from app.api import auth as auth_router
from app.api import transactions as transactions_router

app = FastAPI(title="AutoWallet")

# add the auth routes to the central fastapi app
app.include_router(auth_router.router)
app.include_router(transactions_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Now:
"""
Route Table

Path:"/health"

Method:GET

Function:health_check
"""

"""
Browser
     │
     ▼
Uvicorn Server
     │
     ▼
FastAPI
     │
     ▼
Looks inside route table
     │
     ▼
"/health" found
     │
     ▼
health_check()
     │
     ▼
Returns Python dictionary
     │
     ▼
FastAPI converts it to JSON
     │
     ▼
Browser receives
{
    "status": "ok"
}
"""
