# LossFunction - Comprehensive Project Details

## 1. Project Overview
**LossFunction** is a Transaction Fraud Risk Scorer designed for the Razorpay Buildathon. It implements a **Cost-Optimized Decisioning System** combined with a **Two-Tier Architecture**. Unlike naive ML models that optimize for pure accuracy or F1-scores, LossFunction acknowledges that false positives (blocking genuine customers) and false negatives (allowing fraud) have drastically different financial impacts depending on the merchant's unit economics.

## 2. Core Functionality & Features

### Two-Tier Triage Architecture
To balance strict payment gateway latency budgets with deep analytical capabilities, the system uses a two-tier approach:
*   **Tier 1 (Synchronous Fast-Path):** A lightweight LightGBM model evaluating fast tabular features (amount, MCC, time, 1-hour velocity). Executes in `< 20ms` to instantly auto-approve low-risk transactions or fast-track extremely high-risk ones.
*   **Tier 2 (Asynchronous Deep Analysis):** An XGBoost Classifier utilizing full Indian BFSI signals, supplemented by a Local SHAP TreeExplainer. Executes in `< 500ms` for borderline transactions, routing them to a deep queue for further analysis.

### Indian BFSI Feature Engineering
The system models authentic payment dynamics unique to the Indian market:
*   **Payment Methods:** Adaptive support for Cards, UPI, and Net-Banking.
*   **UPI Signals:** Tracks VPA (handle) age, and 60-second UPI attempt velocity (flags rapid-fire velocity spikes and disposable VPAs).
*   **Net-Banking Signals:** IFSC code tracking and Session Risk anomaly detection.
*   **Card Signals:** Evaluates Card Testing Velocity (60s retries), and Regional BIN Anomalies (e.g., rural cooperative banks executing luxury purchases).
*   **Logistics & Geolocation:** Pincode Logistics Mismatch Risk (distance between billing and shipping) and State Geolocation Mismatches.
*   **Behavioral:** Time-of-Day vs. Category anomalies (e.g., late-night gaming tokens) and Customer Baseline Deviation.

### Dynamic Merchant Risk Profiles (Cost Matrix Engine)
The system calculates an optimal decision threshold ($p^*$) tailored to specific merchant personas, minimizing expected financial loss (₹):
*   **Digital SaaS & Subscriptions:** High margin (85%), high churn loss. Focuses on minimizing friction (Threshold ~69%).
*   **High-Value Electronics:** Low margin (8%), high inventory loss. Holds aggressively (Threshold ~9%).
*   **Quick Commerce & Food:** Thin margins, high competition. Balances fraud vs. churn (Threshold ~45%).
*   **Gaming & Digital Assets:** Instant liquidity cash-outs with high dispute penalties (Threshold ~39%).

### Human-in-the-Loop Risk Ops Dashboard
*   **Strictly Defense-Only:** A read-only advisory scoring pipeline with zero offensive/blocking capabilities.
*   **SHAP Explainability:** Translates complex ML features into readable reason codes (e.g., "UPI Rapid-Fire Velocity Spike", "Pincode Logistics Mismatch").
*   **Analyst Override:** Human analysts retain final decision authority (Approve/Hold/Review) via the dashboard.

## 3. Technology Stack

### Backend (Python)
*   **Framework:** FastAPI, Uvicorn
*   **Machine Learning:** XGBoost (Tier 2), LightGBM (Tier 1), Scikit-Learn
*   **Explainability:** SHAP (SHapley Additive exPlanations)
*   **Data Processing:** Pandas, NumPy
*   **Simulation/Data Pipeline:** Custom synthetic data generation mimicking real-world transaction distributions and fraud patterns.

### Frontend (TypeScript/React)
*   **Framework:** React (Vite)
*   **Language:** TypeScript
*   **Styling:** Custom CSS (Glassmorphic Dark-Mode UI)
*   **Architecture:** Component-based (TransactionQueue, AnalystSidebar, MetricsOverview, PersonaSelector)

## 4. Limitations & Future Scope

### Current Limitations
1.  **Synthetic Data:** The system currently relies on synthetically generated transactions and simulated features (though statistically modeled on authentic BFSI dynamics).
2.  **In-Memory State:** For demonstration purposes, transactions and models are loaded into local memory. It lacks a persistent distributed database (e.g., Redis, PostgreSQL) required for production.
3.  **Read-Only Scope:** It acts as an advisory queue and does not integrate with actual payment gateways to actively block or process funds (by design for security, but limits end-to-end automation).
4.  **Local Execution:** The architecture is designed to run locally on a single node rather than a scalable cloud-native microservices architecture.

### Future Scope
1.  **Distributed Infrastructure:** Migration to Kubernetes with a scalable message broker (Kafka/RabbitMQ) between Tier 1 and Tier 2.
2.  **Graph Neural Networks (GNN):** Implementing GNNs to map complex fraud rings and multi-hop money laundering across VPAs and IFSCs.
3.  **Real-Time Data Streams:** Connecting to live Kafka streams for true real-time feature aggregation (e.g., global velocity across the entire payment network).
4.  **Automated Actions:** With sufficient trust in the Cost Matrix Engine, introducing automated hold/block API webhooks back to the payment gateway.
