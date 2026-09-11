import httpx
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import User
from app.services.payment_processor import process_payment


def poll_bank_simulator():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.bank_account_id.isnot(None)).all()
        for user in users:
            try:
                response = httpx.get(
                    f"{settings.bank_simulator_url}/simulator/accounts/{user.bank_account_id}",
                    timeout=5,
                )
                if response.status_code != 200:
                    continue  # account doesn't exist yet in the simulator - nothing to do

                for tx in response.json()["transactions"]:
                    process_payment(user, tx["reference"], tx["amount"], db)
            except httpx.RequestError:
                continue  # simulator unreachable this cycle - just try again next time
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(poll_bank_simulator, "interval", seconds=60)