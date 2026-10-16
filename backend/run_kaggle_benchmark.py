"""
Real-World Kaggle Dataset Benchmark: mlg-ulb/creditcardfraud
=============================================================
Demonstrates Two-Tier ML Architecture and Cost-Sensitive Thresholding (p*)
directly on the ground-truth Kaggle Credit Card Fraud dataset (284,807 transactions).

Loads data via `kagglehub` with graceful fallback to local `data/creditcard.csv`.
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import lightgbm as lgb
import xgboost as xgb
from sklearn.metrics import roc_auc_score, average_precision_score, confusion_matrix

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def load_kaggle_data():
    """Loads mlg-ulb/creditcardfraud via kagglehub, or falls back to local creditcard.csv."""
    root_dir = os.path.dirname(os.path.dirname(__file__))
    local_csv = os.path.join(root_dir, 'data', 'creditcard.csv')

    df = None
    try:
        import kagglehub
        print("Attempting to load latest dataset via kagglehub ('mlg-ulb/creditcardfraud')...")
        dataset_dir = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
        csv_file = os.path.join(dataset_dir, "creditcard.csv")
        if os.path.exists(csv_file):
            df = pd.read_csv(csv_file)
            print(f"Successfully loaded via kagglehub: {len(df):,} transactions.")
    except Exception as e:
        print(f"kagglehub notice: {e}")
        
    if df is None:
        if os.path.exists(local_csv):
            print(f"Using local verified Kaggle dataset at: {local_csv}")
            df = pd.read_csv(local_csv)
        else:
            raise FileNotFoundError(
                f"Could not load via kagglehub and local {local_csv} not found."
            )
            
    return df

def run_real_kaggle_benchmark():
    df = load_kaggle_data()
    
    total_tx = len(df)
    total_fraud = int(df['Class'].astype(int).sum())
    fraud_rate = (total_fraud / total_tx) * 100
    print(f"\n=======================================================")
    print(f"Dataset Overview: {total_tx:,} transactions | {total_fraud} frauds ({fraud_rate:.3f}% prevalence)")
    print(f"=======================================================")

    # 1. Feature Engineering on Pure Kaggle Data
    df = df.sort_values(by='Time').reset_index(drop=True)
    df['hour'] = ((df['Time'] / 3600) % 24).astype(int)
    df['amount_log'] = np.log1p(df['Amount'])
    df['Class'] = df['Class'].astype(int)
    
    # 2. Strict Time-Based Split (Train 80%, Held-out Test 20%)
    split_idx = int(total_tx * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    
    train_fraud = int(train_df['Class'].sum())
    test_fraud = int(test_df['Class'].sum())
    print(f"Time-Split: Train={len(train_df):,} (Fraud={train_fraud}), Test={len(test_df):,} (Fraud={test_fraud})")

    # Tier 1 Fast Features (No heavy PCA: Amount, log-amount, time-of-day)
    tier1_features = ['Amount', 'amount_log', 'hour']
    
    # Tier 2 Deep Features (Full PCA V1-V28 + operational signals)
    pca_cols = [f'V{i}' for i in range(1, 29)]
    tier2_features = pca_cols + ['Amount', 'amount_log', 'hour']
    
    X_train_t1 = train_df[tier1_features]
    X_test_t1 = test_df[tier1_features]
    
    X_train_t2 = train_df[tier2_features]
    X_test_t2 = test_df[tier2_features]
    
    y_train = train_df['Class']
    y_test = test_df['Class']

    # -------------------------------------------------------------
    # 3. Train Tier 1: Instant Low-Latency Model (LightGBM)
    # -------------------------------------------------------------
    print("\n[Tier 1] Training Low-Latency LightGBM on operational features...")
    pos_weight = (len(y_train) - train_fraud) / train_fraud
    
    t1_model = lgb.LGBMClassifier(
        n_estimators=50,
        max_depth=3,
        num_leaves=8,
        learning_rate=0.1,
        scale_pos_weight=pos_weight * 0.2,
        random_state=42,
        verbosity=-1
    )
    t1_model.fit(X_train_t1, y_train)
    
    t1_infer_start = time.time()
    t1_preds = t1_model.predict_proba(X_test_t1)[:, 1]
    t1_latency_ms = ((time.time() - t1_infer_start) / len(X_test_t1)) * 1000
    print(f"Tier 1 Inference Latency: {t1_latency_ms:.4f} ms per transaction")

    # -------------------------------------------------------------
    # 4. Train Tier 2: Deep Analysis XGBoost (Calibrated Probabilities)
    # -------------------------------------------------------------
    print("\n[Tier 2] Training Deep Analysis XGBoost on full Kaggle PCA feature set...")
    t2_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
        eval_metric='logloss'
    )
    t2_model.fit(X_train_t2, y_train)
    
    t2_preds = t2_model.predict_proba(X_test_t2)[:, 1]
    test_df['pred_prob'] = t2_preds

    # -------------------------------------------------------------
    # 5. Model Evaluation Metrics
    # -------------------------------------------------------------
    roc_auc = float(roc_auc_score(y_test, t2_preds))
    pr_auc = float(average_precision_score(y_test, t2_preds))
    
    print("\n" + "=" * 55)
    print("REAL KAGGLE DATASET EVALUATION RESULTS")
    print("=" * 55)
    print(f"PR-AUC (Precision-Recall AUC): {pr_auc:.4f}")
    print(f"ROC-AUC:                     {roc_auc:.4f}")

    # -------------------------------------------------------------
    # 6. Cost-Optimal Loss Function Evaluation (Real-World Economics)
    # -------------------------------------------------------------
    # In real payment processing:
    # C_FN (False Negative): We miss fraud -> Loss = Amount + Chargeback Fee ($20)
    # C_FP (False Positive): We decline genuine -> Loss = Lost Interchange Margin (2.5%) + Customer Friction ($12)
    chargeback_fee = 20.0
    margin_rate = 0.025
    friction_cost = 12.0
    
    c_fn = test_df['Amount'] + chargeback_fee
    c_fp = (margin_rate * test_df['Amount']) + friction_cost
    
    # Cost-optimal threshold p* for every individual transaction:
    # p* = C_FP / (C_FP + C_FN)
    test_df['p_star'] = c_fp / (c_fp + c_fn)
    
    # Evaluate 3 Decision Policies:
    # Policy A: Allow All (Baseline - zero detection)
    allow_all_cost = float((test_df['Class'] * c_fn).sum())
    
    # Policy B: Static ML Threshold (Standard default 0.50 cutoff)
    pred_static = (test_df['pred_prob'] > 0.50).astype(int)
    fp_static = (pred_static == 1) & (test_df['Class'] == 0)
    fn_static = (pred_static == 0) & (test_df['Class'] == 1)
    static_cost = float((fp_static * c_fp).sum() + (fn_static * c_fn).sum())
    
    # Policy C: Cost-Optimal Dynamic Threshold (p > p*)
    pred_optimal = (test_df['pred_prob'] > test_df['p_star']).astype(int)
    fp_optimal = (pred_optimal == 1) & (test_df['Class'] == 0)
    fn_optimal = (pred_optimal == 0) & (test_df['Class'] == 1)
    optimal_cost = float((fp_optimal * c_fp).sum() + (fn_optimal * c_fn).sum())
    
    print("\n" + "-" * 55)
    print("UNIT ECONOMICS & LOSS FUNCTION COMPARISON (USD)")
    print("-" * 55)
    print(f"Policy A [Allow All (No Detection)]:  ${allow_all_cost:,.2f}")
    print(f"Policy B [Static ML Cutoff (0.50)]:   ${static_cost:,.2f}")
    print(f"Policy C [Cost-Optimal Dynamic (p*)]: ${optimal_cost:,.2f}")
    print(f"-> Savings vs. Allow All:             ${allow_all_cost - optimal_cost:,.2f}")
    print(f"-> Savings vs. Static 0.50 Threshold: ${static_cost - optimal_cost:,.2f}")
    print("-" * 55)
    
    cm_static = confusion_matrix(y_test, pred_static)
    cm_optimal = confusion_matrix(y_test, pred_optimal)
    print(f"\nStatic 0.50 Confusion Matrix (TN, FP / FN, TP):\n{cm_static}")
    print(f"Cost-Optimal Confusion Matrix (TN, FP / FN, TP):\n{cm_optimal}")
    print(f"\nAverage Cost-Optimal Threshold p*: {test_df['p_star'].mean():.2%}")
    print("=" * 55)

if __name__ == "__main__":
    run_real_kaggle_benchmark()
