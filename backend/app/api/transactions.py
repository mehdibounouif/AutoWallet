from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import TransactionCreate, TransactionOut
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Rule, Transaction, TransactionStatus, User, Wallet
from app.services.rule_engine import RuleInput, apply_rules
from app.api.schemas import TransactionOut

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Transaction).filter(Transaction.reference == payload.reference).first():
        raise HTTPException(status_code=400, detail="A transaction with this reference already exists")

    transaction = Transaction(
        user_id=current_user.id,
        reference=payload.reference,
        amount=payload.amount,
        status=TransactionStatus.pending,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    wallet_balances = {f"{w.wallet_type.value}_balance": w.balance for w in wallets}
    wallets_by_type = {w.wallet_type.value: w for w in wallets}

    rules = (
        db.query(Rule)
        .filter(Rule.user_id == current_user.id, Rule.is_active == True)  # noqa: E712
        .all()
    )
    rule_inputs = [
        RuleInput(
            name=r.name, rule_type=r.rule_type.value, target_wallet=r.target_wallet.value,
            priority=r.priority, fixed_amount=r.fixed_amount, percentage=r.percentage,
            condition_field=r.condition_field, condition_operator=r.condition_operator,
            condition_value=r.condition_value,
        )
        for r in rules
    ]

    allocations = apply_rules(payload.amount, rule_inputs, wallet_balances)

    for wallet_type, take in allocations.items():
        wallets_by_type[wallet_type].balance += take

    transaction.status = TransactionStatus.processed
    transaction.processed_at = datetime.utcnow()
    db.commit()
    db.refresh(transaction)

    return transaction


@router.get("/", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )