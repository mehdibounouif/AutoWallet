from fastapi import FastAPI

app = FastAPI(title="AutoWallet")

""" Decorator """

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
