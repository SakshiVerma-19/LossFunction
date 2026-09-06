"""
Validation & Stress-Testing Suite (Defense-Only Architecture)
=============================================================
This module generates realistic Indian BFSI payment signals layered on top of
public ground-truth card transaction data for model validation, threshold calibration,
and ops review queue stress-testing.

Payment Methods Supported:
- Card (Credit / Debit): BIN-level, regional bank anomalies, card-testing velocity.
- UPI: VPA (Virtual Payment Address), 60-second attempt velocity, VPA account age.
- Net-Banking: IFSC code, hashed account identifier, session risk score.

Security Boundary:
- Consumes transaction payloads and emits structured risk signals.
- Contains zero offensive code, zero automated block endpoints, and zero payout triggers.
"""

import os
import urllib.request
import pandas as pd
import numpy as np
import hashlib

def download_base_dataset():
    """Ensures the base creditcard.csv dataset is downloaded locally."""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'creditcard.csv')
    if not os.path.exists(csv_path):
        print("Downloading base creditcard.csv from TensorFlow public storage bucket...")
        url = "https://storage.googleapis.com/download.tensorflow.org/data/creditcard.csv"
        urllib.request.urlretrieve(url, csv_path)
        print("Base dataset download complete.")
    else:
        print(f"Base dataset verified at: {csv_path}")
    return csv_path

def generate_validation_bfsi_features(raw_csv_path):
    """
    Overlays authentic Indian BFSI payment signals onto the ground-truth dataset:
    - 4 Merchant Personas: Digital SaaS, High-Value Electronics, Quick Commerce, Gaming/Crypto.
    - BIN-Level Regional Anomalies: Rural Regional/Co-op Bank BIN vs Metro Premium.
    - Pincode & Logistics Distance Risk: Billing vs Shipping Pincode mismatch risk.
    - Card Testing Velocity Spike: Failed attempts in preceding 60 seconds.
    - Time-of-Day vs Category Anomaly: High-ticket digital assets at 3:30 AM IST.
    """
    print("Loading base transaction dataset...")
    df = pd.read_csv(raw_csv_path)
    
    # Downsample genuine transactions while retaining 100% of ground-truth fraud for realistic ~1.0% prevalence
    fraud_df = df[df['Class'] == 1]
    genuine_df = df[df['Class'] == 0].sample(n=50000 - len(fraud_df), random_state=42)
    df = pd.concat([fraud_df, genuine_df]).sort_values(by='Time').reset_index(drop=True)
    
    n_samples = len(df)
    print(f"Validation dataset structured: {n_samples} total transactions ({len(fraud_df)} fraud, {len(genuine_df)} genuine)")
    
    np.random.seed(42)
    
    # 1. Indian Merchant Personas
    personas = [
        {"id": "digital_saas", "name": "Digital SaaS & Subscriptions", "mcc": "5734", "mcc_name": "Software SaaS", "avg_range": (199, 1499)},
        {"id": "electronics", "name": "High-Value Electronics Retail", "mcc": "5732", "mcc_name": "Consumer Electronics", "avg_range": (18000, 75000)},
        {"id": "quick_commerce", "name": "Quick Commerce & Food Delivery", "mcc": "5812", "mcc_name": "Food & Quick Grocery", "avg_range": (180, 1800)},
        {"id": "gaming_assets", "name": "Gaming & Digital Assets", "mcc": "7995", "mcc_name": "Digital Vouchers / Gaming", "avg_range": (1200, 28000)}
    ]
    
    persona_choices = np.random.choice([p["id"] for p in personas], size=n_samples, p=[0.25, 0.25, 0.25, 0.25])
    df['merchant_persona'] = persona_choices
    
    persona_map = {p["id"]: p for p in personas}
    df['merchant_name'] = [
        "Razorpay - " + (
            "Notion / Zoho SaaS" if pid == "digital_saas" else
            "Croma / Apple Store" if pid == "electronics" else
            "Zepto / Swiggy Instamart" if pid == "quick_commerce" else
            "Steam / WinZO Gaming"
        ) for pid in persona_choices
    ]
    df['mcc'] = [persona_map[pid]["mcc"] for pid in persona_choices]
    df['mcc_name'] = [persona_map[pid]["mcc_name"] for pid in persona_choices]
    
    # 2. Indian Card BIN Database (Including Regional Rural & Co-op Banks)
    bins_data = [
        {"bin": "451123", "bank": "HDFC Bank (Infinia)", "tier": "metro_tier1", "bin_risk": 0.015},
        {"bin": "400015", "bank": "SBI (Global Visa)", "tier": "national_psu", "bin_risk": 0.025},
        {"bin": "510022", "bank": "ICICI Bank (Sapphiro)", "tier": "metro_tier1", "bin_risk": 0.018},
        {"bin": "411122", "bank": "Axis Bank (Magnus)", "tier": "metro_tier1", "bin_risk": 0.020},
        {"bin": "607100", "bank": "Aryavart Gramin Regional Bank", "tier": "rural_regional", "bin_risk": 0.085},
        {"bin": "504437", "bank": "Saraswat Co-operative Bank", "tier": "coop_urban", "bin_risk": 0.065},
        {"bin": "652156", "bank": "Punjab National Bank (RuPay)", "tier": "national_psu", "bin_risk": 0.030}
    ]
    
    bin_list = [b["bin"] for b in bins_data]
    bin_map = {b["bin"]: b for b in bins_data}
    
    # Genuine vs Fraud BIN assignment
    bin_probs_gen = [0.25, 0.25, 0.20, 0.15, 0.04, 0.05, 0.06]
    bin_probs_fraud = [0.10, 0.10, 0.10, 0.10, 0.30, 0.20, 0.10]
    
    gen_idx = df[df['Class'] == 0].index
    fraud_idx = df[df['Class'] == 1].index
    
    df['card_bin'] = ""
    df.loc[gen_idx, 'card_bin'] = np.random.choice(bin_list, size=len(gen_idx), p=bin_probs_gen)
    df.loc[fraud_idx, 'card_bin'] = np.random.choice(bin_list, size=len(fraud_idx), p=bin_probs_fraud)
    
    df['card_bank'] = df['card_bin'].map(lambda b: bin_map[b]["bank"])
    df['bin_regional_tier'] = df['card_bin'].map(lambda b: bin_map[b]["tier"])
    df['bin_regional_risk'] = df['card_bin'].map(lambda b: bin_map[b]["bin_risk"])
    
    # 3. Customer Profile & State Mapping
    n_customers = 800
    pincode_clusters = [
        {"state": "Maharashtra", "billing_pin": "400001", "city": "Mumbai"},
        {"state": "Karnataka", "billing_pin": "560001", "city": "Bengaluru"},
        {"state": "Delhi", "billing_pin": "110001", "city": "New Delhi"},
        {"state": "Tamil Nadu", "billing_pin": "600001", "city": "Chennai"},
        {"state": "Telangana", "billing_pin": "500001", "city": "Hyderabad"},
        {"state": "West Bengal", "billing_pin": "700001", "city": "Kolkata"},
        {"state": "Uttar Pradesh", "billing_pin": "201301", "city": "Noida"},
        {"state": "Gujarat", "billing_pin": "380001", "city": "Ahmedabad"}
    ]
    
    customers = []
    for i in range(n_customers):
        c_id = f"CUST_IN_{i:04d}"
        cluster = np.random.choice(pincode_clusters)
        home_device = hashlib.md5(f"device_in_{c_id}".encode()).hexdigest()[:8]
        customers.append({
            "customer_id": c_id,
            "home_state": cluster["state"],
            "billing_pincode": cluster["billing_pin"],
            "city": cluster["city"],
            "home_device": home_device
        })
    cust_df = pd.DataFrame(customers)
    
    df['customer_id'] = np.random.choice(cust_df['customer_id'], size=n_samples)
    df = df.merge(cust_df, on='customer_id', how='left')
    
    # 4. Realistic Amount Scaling based on Merchant Persona
    df['amount_scaled'] = 0.0
    for pid in [p["id"] for p in personas]:
        p_info = persona_map[pid]
        p_mask = df['merchant_persona'] == pid
        
        # Genuine: normal distribution centered within range
        gen_p_mask = p_mask & (df['Class'] == 0)
        low, high = p_info["avg_range"]
        mean_val = (low + high) / 2
        std_val = (high - low) / 5
        gen_amounts = np.random.normal(mean_val, std_val, size=gen_p_mask.sum())
        df.loc[gen_p_mask, 'amount_scaled'] = np.clip(gen_amounts, low, high * 1.5)
        
        # Fraud: spikes towards upper limit or multiple ticket size
        fraud_p_mask = p_mask & (df['Class'] == 1)
        fraud_amounts = np.random.uniform(high * 0.8, high * 2.2, size=fraud_p_mask.sum())
        df.loc[fraud_p_mask, 'amount_scaled'] = fraud_amounts
        
    df['amount_scaled'] = df['amount_scaled'].round(2)
    
    # Compute relative amount deviation
    cust_avg_amounts = df.groupby('customer_id')['amount_scaled'].transform('mean')
    df['amount_vs_historical_ratio'] = (df['amount_scaled'] / cust_avg_amounts).round(2)
    
    # 5. Pincode & Logistics Distance Risk
    df['shipping_pincode'] = df['billing_pincode']
    df['pincode_distance_risk'] = 0.05 # Baseline minimal risk
    
    remote_pincodes = ["795001", "799001", "190001", "734001", "851101"] # Remote/border high-risk fulfillment circles
    
    # Genuine: 96% match, 4% slight variation (travel/gifting)
    gen_mismatch_idx = np.random.choice(gen_idx, size=int(len(gen_idx) * 0.04), replace=False)
    for idx in gen_mismatch_idx:
        df.loc[idx, 'shipping_pincode'] = np.random.choice([p["billing_pin"] for p in pincode_clusters if p["billing_pin"] != df.loc[idx, 'billing_pincode']])
        df.loc[idx, 'pincode_distance_risk'] = 0.25
        
    # Fraud: 85% high-risk distance mismatch or remote drop-shipping address
    fraud_mismatch_idx = np.random.choice(fraud_idx, size=int(len(fraud_idx) * 0.85), replace=False)
    for idx in fraud_mismatch_idx:
        df.loc[idx, 'shipping_pincode'] = np.random.choice(remote_pincodes)
        df.loc[idx, 'pincode_distance_risk'] = np.random.uniform(0.78, 0.96)
        
    # 6. Card Testing Velocity in Preceding 60 Seconds
    df['card_testing_velocity_60s'] = 0
    df.loc[gen_idx, 'card_testing_velocity_60s'] = np.random.choice([0, 1], size=len(gen_idx), p=[0.98, 0.02])
    df.loc[fraud_idx, 'card_testing_velocity_60s'] = np.random.choice([0, 2, 3, 4, 5, 6], size=len(fraud_idx), p=[0.10, 0.20, 0.30, 0.20, 0.10, 0.10])
    
    # 7. Time of Day vs Category Anomaly (3:30 AM IST Digital Goods)
    df['hour_ist'] = ((df['Time'] / 3600) % 24).astype(int)
    
    is_night_window = (df['hour_ist'] >= 2) & (df['hour_ist'] <= 5)
    is_instant_liquid = df['merchant_persona'].isin(['gaming_assets', 'digital_saas'])
    df['time_mcc_anomaly'] = (is_night_window & is_instant_liquid).astype(int)
    
    for idx in fraud_idx:
        if np.random.rand() < 0.45:
            df.loc[idx, 'hour_ist'] = np.random.choice([2, 3, 4])
            df.loc[idx, 'time_mcc_anomaly'] = 1
            
    # 8. Device & IP Geolocation Mismatch
    df['device_mismatch'] = 0
    df['ip_mismatch'] = 0
    df['state'] = df['home_state']
    
    df.loc[gen_idx, 'device_mismatch'] = np.random.choice([0, 1], size=len(gen_idx), p=[0.97, 0.03])
    df.loc[gen_idx, 'ip_mismatch'] = np.random.choice([0, 1], size=len(gen_idx), p=[0.96, 0.04])
    
    df.loc[fraud_idx, 'device_mismatch'] = np.random.choice([0, 1], size=len(fraud_idx), p=[0.08, 0.92])
    df.loc[fraud_idx, 'ip_mismatch'] = np.random.choice([0, 1], size=len(fraud_idx), p=[0.12, 0.88])
    
    all_states = [p["state"] for p in pincode_clusters]
    for idx in df[df['ip_mismatch'] == 1].index:
        other_states = [s for s in all_states if s != df.loc[idx, 'home_state']]
        df.loc[idx, 'state'] = np.random.choice(other_states)
        
    # 9. Rolling 1-Hour Velocity
    # Compute rolling count using a fast numeric window
    df = df.sort_values(by='Time').reset_index(drop=True)
    
    # Use pandas datetime rolling for 1h window
    df['dt_temp'] = pd.to_datetime(df['Time'], unit='s')
    df['velocity_1h'] = (
        df.groupby('customer_id', group_keys=False)
        .apply(lambda grp: grp.rolling('3600s', on='dt_temp', closed='left')['Time'].count())
        .fillna(0)
        .astype(int)
    )
    df.drop(columns=['dt_temp'], inplace=True)
    
    for idx in fraud_idx:
        df.loc[idx, 'velocity_1h'] += np.random.randint(2, 5)
        
    # ── 10. Payment Method Overlay ────────────────────────────────────────────
    # Assign payment method: genuine skews card/UPI; fraud skews UPI (high velocity)
    pm_options = ["card", "upi", "netbanking"]
    pm_probs_gen   = [0.50, 0.35, 0.15]
    pm_probs_fraud = [0.30, 0.55, 0.15]   # Fraud prefers UPI (instant, harder to reverse)

    df['payment_method'] = ""
    df.loc[gen_idx,   'payment_method'] = np.random.choice(pm_options, size=len(gen_idx),   p=pm_probs_gen)
    df.loc[fraud_idx, 'payment_method'] = np.random.choice(pm_options, size=len(fraud_idx), p=pm_probs_fraud)

    # ── UPI signals ──────────────────────────────────────────────────────────
    upi_banks    = ["okicici", "oksbi", "okhdfc", "okaxis", "ybl", "paytm", "upi"]
    upi_gen_idx   = df[df['payment_method'] == 'upi'].index.intersection(gen_idx)
    upi_fraud_idx = df[df['payment_method'] == 'upi'].index.intersection(fraud_idx)

    # VPA — e.g. cust1234@okicici
    df['vpa'] = None
    df.loc[upi_gen_idx,   'vpa'] = [
        f"{cid.lower().replace('_', '')}@{np.random.choice(upi_banks)}"
        for cid in df.loc[upi_gen_idx, 'customer_id']
    ]
    df.loc[upi_fraud_idx, 'vpa'] = [
        # Fraud often uses randomly generated / disposable VPAs
        f"usr{hashlib.md5(str(idx).encode()).hexdigest()[:6]}@{np.random.choice(upi_banks)}"
        for idx in upi_fraud_idx
    ]

    # UPI velocity in last 60 seconds
    df['upi_velocity_60s'] = 0
    df.loc[upi_gen_idx,   'upi_velocity_60s'] = np.random.choice([0, 1],          size=len(upi_gen_idx),   p=[0.92, 0.08])
    df.loc[upi_fraud_idx, 'upi_velocity_60s'] = np.random.choice([1, 2, 3, 4, 5], size=len(upi_fraud_idx), p=[0.10, 0.25, 0.30, 0.20, 0.15])

    # VPA account age in days (new accounts are riskier)
    df['vpa_age_days'] = 0
    df.loc[upi_gen_idx,   'vpa_age_days'] = np.random.randint(180, 1800, size=len(upi_gen_idx))
    df.loc[upi_fraud_idx, 'vpa_age_days'] = np.random.randint(0,   60,   size=len(upi_fraud_idx))  # Fraud = fresh VPA

    # ── Net-Banking signals ───────────────────────────────────────────────────
    ifsc_prefixes = ["HDFC", "SBIN", "ICIC", "UTIB", "PUNB", "BARB", "CNRB"]
    nb_gen_idx   = df[df['payment_method'] == 'netbanking'].index.intersection(gen_idx)
    nb_fraud_idx = df[df['payment_method'] == 'netbanking'].index.intersection(fraud_idx)

    df['ifsc_code'] = None
    df.loc[nb_gen_idx,   'ifsc_code'] = [
        f"{np.random.choice(ifsc_prefixes)}0{np.random.randint(100000, 999999)}"
        for _ in range(len(nb_gen_idx))
    ]
    df.loc[nb_fraud_idx, 'ifsc_code'] = [
        f"{np.random.choice(ifsc_prefixes)}0{np.random.randint(100000, 999999)}"
        for _ in range(len(nb_fraud_idx))
    ]

    # Hashed bank account number (never store raw account numbers)
    df['bank_account_hash'] = df.apply(
        lambda row: hashlib.sha256(
            f"{row['customer_id']}_{row.get('ifsc_code', '')}".encode()
        ).hexdigest()[:12]
        if row['payment_method'] == 'netbanking' else None,
        axis=1
    )

    # Net-banking session risk: genuine sessions are low risk; fraud sessions show anomaly
    df['netbanking_session_risk'] = 0.0
    df.loc[nb_gen_idx,   'netbanking_session_risk'] = np.random.uniform(0.01, 0.15, size=len(nb_gen_idx))
    df.loc[nb_fraud_idx, 'netbanking_session_risk'] = np.random.uniform(0.60, 0.98, size=len(nb_fraud_idx))

    # ── Composite payment method risk score (numeric signal for model) ────────
    # card: baseline; upi: depends on velocity & VPA age; netbanking: session risk
    def compute_pm_risk(row):
        pm = row['payment_method']
        if pm == 'card':
            return float(row['bin_regional_risk'])
        elif pm == 'upi':
            vel_risk = min(row['upi_velocity_60s'] * 0.12, 0.60)
            age_risk = max(0.0, 1.0 - row['vpa_age_days'] / 365.0) * 0.35
            return round(min(vel_risk + age_risk, 0.95), 4)
        else:  # netbanking
            return float(row['netbanking_session_risk'])

    df['payment_method_risk'] = df.apply(compute_pm_risk, axis=1)

    processed_csv_path = os.path.join(os.path.dirname(raw_csv_path), 'processed_transactions.csv')
    df.to_csv(processed_csv_path, index=False)
    print(f"Validation & Stress-Testing dataset generated successfully at: {processed_csv_path}")
    return processed_csv_path

if __name__ == "__main__":
    raw_path = download_base_dataset()
    generate_validation_bfsi_features(raw_path)
