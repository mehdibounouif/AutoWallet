"""
Financial Knowledge Base for AutoWallet RAG System.
Contains comprehensive, domain-specific articles, tax laws, and budgeting frameworks
for Moroccan and international freelancers, remote contractors, and independent creators.
"""

from typing import Any

FINANCIAL_KNOWLEDGE_DOCUMENTS: list[dict[str, Any]] = [
    {
        "id": "kb-morocco-auto-entrepreneur",
        "title": "Moroccan Auto-Entrepreneur Tax Regime & Withholding Rates",
        "category": "tax",
        "keywords": ["morocco", "maroc", "auto", "entrepreneur", "auto-entrepreneur", "tax", "taxes", "turnover", "rate", "impot", "impots", "dirham", "mad"],
        "content": (
            "In Morocco, the Auto-Entrepreneur (AE) status offers simplified taxation. "
            "For service providers and liberal professions, the flat income tax rate is 1% of turnover up to 200,000 MAD annually. "
            "For commercial, industrial, and craft activities, the tax rate is 0.5% of turnover up to 500,000 MAD. "
            "Beyond 80,000 MAD billed to a single Moroccan corporate client in a fiscal year, a 30% withholding tax (retenue à la source) "
            "is applied on the excess amount by the client. Freelancers working with foreign clients (export of services) are exempt from this 30% rule. "
            "Auto-entrepreneurs must file quarterly turnover declarations via the RNPAE portal and allocate appropriate reserves in their Tax envelope."
        ),
    },
    {
        "id": "kb-morocco-cnss-amo",
        "title": "Social Security (CNSS AMO) for Moroccan Freelancers",
        "category": "health_insurance",
        "keywords": ["cnss", "amo", "health", "social security", "morocco", "cotisation"],
        "content": (
            "Independent workers and auto-entrepreneurs in Morocco are legally mandated to register for mandatory health insurance (AMO) through CNSS. "
            "Monthly contributions range from 100 MAD to 300 MAD depending on the professional category and declared base income. "
            "Maintaining regular contributions is essential to keep active healthcare rights. AutoWallet users are recommended to configure a fixed monthly lock "
            "rule of 150-250 MAD into a dedicated reserve to guarantee automated CNSS payment without manual oversight."
        ),
    },
    {
        "id": "kb-envelope-budgeting-method",
        "title": "The Digital Envelope Budgeting Method for Irregular Income",
        "category": "budgeting",
        "keywords": ["envelope", "budgeting", "irregular income", "split", "cashflow", "allocation"],
        "content": (
            "Traditional monthly budgets fail for freelancers because income arrives in lump sums at random intervals rather than on a fixed payday. "
            "The envelope budgeting method solves this by partitioning every inbound payment the moment it hits the account: "
            "1. Rent / Fixed Essentials: An exact fixed sum locked immediately. "
            "2. Tax Reserve: A fixed percentage (usually 15-25%) deducted before discretionary spending. "
            "3. Savings / Emergency Cushion: 10-20% diverted into an emergency fund until capped. "
            "4. Free-to-Spend: The exact remaining balance left in the main discretionary wallet. "
            "This automated flow prevents the common trap of spending gross revenues and facing tax shock months later."
        ),
    },
    {
        "id": "kb-emergency-fund-sizing",
        "title": "Emergency Fund Sizing & Savings Capping Strategy",
        "category": "savings",
        "keywords": ["emergency fund", "savings", "cap", "runway", "safety buffer", "months"],
        "content": (
            "Freelancers face payment volatility and income dips between contracts. Financial planners recommend maintaining 3 to 6 months "
            "of essential living costs (rent, food, basic utilities) in an emergency buffer. In AutoWallet, this is best implemented using a conditional "
            "savings rule with a cap: e.g., 'Take 15% into Savings ONLY IF savings_balance < 15,000 MAD'. "
            "Once the cap is achieved, the rule automatically skips, allowing 100% of remaining funds to flow into investments or free spending without depleting liquid security."
        ),
    },
    {
        "id": "kb-priority-rule-ordering",
        "title": "Priority-Ordered Rule Execution in AutoWallet",
        "category": "rules",
        "keywords": ["priority", "order", "rule engine", "fixed lock", "percentage remainder", "pool"],
        "content": (
            "The AutoWallet rule engine processes rules in ascending priority order (priority 1 runs before priority 2). "
            "Best practice dictates that fixed obligations (such as Rent Lock) must run first (priority 1). Fixed rules take an absolute sum from the pool. "
            "Percentage remainder rules (such as 15% Tax or 15% Savings) run subsequently on the remaining pool. "
            "The final rule should always be a 100% Free-to-Spend remainder rule (highest priority number) to ensure the pool reaches zero and every cent is accounted for."
        ),
    },
    {
        "id": "kb-tax-reserve-calculations",
        "title": "Calculating Freelancer Tax Reserves & Withholding",
        "category": "tax",
        "keywords": ["tax reserve", "percentage", "calculation", "withholding", "audit", "provision"],
        "content": (
            "Never spend pre-tax money. Even if your formal tax return is filed annually or quarterly, tax liability accrues with every single invoice. "
            "For general freelancers, setting aside 20% to 25% of gross invoice earnings ensures sufficient liquidity for income taxes, municipal taxes, and professional fees. "
            "In AutoWallet, keeping an automated percentage rule directly linked to the 'Tax' wallet isolates this money from daily debit card balances, preventing accidental shortfalls."
        ),
    },
    {
        "id": "kb-rent-buffer-strategy",
        "title": "Rent Lock Buffer & Duplicate Payment Prevention",
        "category": "rent",
        "keywords": ["rent", "landlord", "lock fixed", "condition", "duplicate", "monthly"],
        "content": (
            "Rent is usually a fixed monthly expenditure. If a freelancer receives two large payments in a single calendar month, a naive fixed rule would deduct rent twice. "
            "AutoWallet solves this with condition checking: the rent rule includes the condition 'rent_balance < 3500 MAD'. "
            "When the first payment fills the rent wallet to 3500 MAD, the condition becomes false for the second payment, skipping the rent deduction entirely and passing the money forward."
        ),
    },
    {
        "id": "kb-currency-fx-hedging",
        "title": "Multi-Currency Invoicing (USD/EUR) and Exchange Rate Fluctuations",
        "category": "currency",
        "keywords": ["currency", "usd", "eur", "mad", "exchange rate", "conversion", "wire transfer", "foreign"],
        "content": (
            "Freelancers billing international clients in USD, EUR, or GBP must navigate intermediary bank fees, SWIFT transfer costs, and fluctuating exchange rates. "
            "When Moroccan banks convert foreign currency into MAD, spreads typically vary by 1% to 2.5%. "
            "To absorb exchange rate downturns, set your baseline living budget using a conservative conversion rate (e.g. 1 USD = 9.5 MAD rather than 10.2 MAD), "
            "and channel exchange surplus into the Savings envelope as an automatic financial shock absorber."
        ),
    },
    {
        "id": "kb-vat-tva-regulations",
        "title": "Value Added Tax (VAT / TVA) Rules for Independent Contractors",
        "category": "tax",
        "keywords": ["vat", "tva", "services", "invoicing", "threshold", "collect", "remit"],
        "content": (
            "In many jurisdictions, independent contractors crossing specific turnover thresholds must register for VAT (TVA). "
            "In Morocco, standard auto-entrepreneurs are outside the scope of TVA, but SARL AU or sole proprietorships crossing 500,000 MAD must bill 20% TVA. "
            "VAT is not freelancer revenue—it is money collected on behalf of the tax authority. AutoWallet allows dedicated VAT rules to immediately sweep 20% of invoiced TVA "
            "directly into the Tax wallet so it is never treated as personal disposable income."
        ),
    },
    {
        "id": "kb-freelancer-expense-deductions",
        "title": "Legitimate Business Expense Deductions for Remote Workers",
        "category": "deductions",
        "keywords": ["deductions", "expenses", "laptop", "internet", "coworking", "software", "write-off"],
        "content": (
            "Freelancers under real-income tax regimes can deduct verified operational expenses to lower their net taxable base. "
            "Deductible expenses typically include: laptop and monitor amortizations, SaaS subscriptions (Figma, GitHub, Adobe, AWS), "
            "coworking desk rental, professional liability insurance, and home-office prorated internet. "
            "Always retain PDF invoices with company tax ID. Tracking these deductions offsets the tax percentage needed in your AutoWallet rules."
        ),
    },
    {
        "id": "kb-cashflow-smoothing-buffer",
        "title": "Income Smoothing: The 'Salary to Yourself' Technique",
        "category": "cashflow",
        "keywords": ["smoothing", "salary", "volatility", "dry spell", "feast famine", "steady"],
        "content": (
            "Freelance earnings swing between 'feast and famine' cycles. A proven method to maintain psychological calm is income smoothing: "
            "Deposit all incoming client payments into AutoWallet. Use the rules engine to distribute fixed shares to Rent, Tax, and Savings. "
            "The Free-to-Spend envelope acts as your weekly or monthly personal stipend. Even during a high-earning month of 30,000 MAD, "
            "limiting your monthly Free-to-Spend pull to your baseline lifestyle lets the surplus cushion subsequent lean months."
        ),
    },
    {
        "id": "kb-debt-reduction-envelopes",
        "title": "Debt Reduction Strategies (Snowball vs Avalanche) in AutoWallet",
        "category": "debt",
        "keywords": ["debt", "snowball", "avalanche", "interest", "credit", "loan", "payoff"],
        "content": (
            "For freelancers carrying equipment debt or credit balances: "
            "1. Debt Avalanche prioritizes the highest interest rate first, minimizing overall cost. "
            "2. Debt Snowball clears the smallest balance first, building psychological momentum. "
            "In AutoWallet, create a dedicated 'Debt Payoff' rule placed right after Rent Lock. "
            "Allocating a fixed 10% or 500 MAD per incoming invoice accelerates debt principal retirement before discretionary spending occurs."
        ),
    },
]


def get_all_documents() -> list[dict[str, Any]]:
    """Return the complete financial knowledge document dataset."""
    return FINANCIAL_KNOWLEDGE_DOCUMENTS


def add_custom_document(title: str, category: str, keywords: list[str], content: str) -> dict[str, Any]:
    """Add a custom knowledge chunk dynamically to the dataset."""
    doc_id = f"kb-custom-{len(FINANCIAL_KNOWLEDGE_DOCUMENTS) + 1}"
    doc = {
        "id": doc_id,
        "title": title,
        "category": category,
        "keywords": [k.lower() for k in keywords],
        "content": content,
    }
    FINANCIAL_KNOWLEDGE_DOCUMENTS.append(doc)
    return doc
