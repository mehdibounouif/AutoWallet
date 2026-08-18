from pydantic import BaseModel, EmailStr, Field

# request from the registration
class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    bank_account_id: str = Field(min_length=3, max_length=50)

# request from the login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# respond to registreation
class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    bank_account_id: str

    class Config:
        from_attributes = True

# respond to login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TransactionCreate(BaseModel):
    reference: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)


class TransactionOut(BaseModel):
    id: str
    reference: str
    amount: float
    status: str

    class Config:
        from_attributes = True


class WalletOut(BaseModel):
    id: str
    wallet_type: str
    balance: float

    class Config:
        from_attributes = True


class RuleOut(BaseModel):
    id: str
    name: str
    rule_type: str
    target_wallet: str
    priority: int
    fixed_amount: float | None
    percentage: float | None
    condition_field: str | None
    condition_operator: str | None
    condition_value: float | None
    is_active: bool

    class Config:
        from_attributes = True