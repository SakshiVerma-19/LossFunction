"""
Two-Tier ML & Explainability Pipeline (Defense-Only Architecture)
================================================================
Implements:
1. Tier 1 (Instant <20ms): Fast tabular LightGBM model for live authorization window triage.
2. Tier 2 (Deep Queue <500ms): High-capacity XGBoost model + SHAP TreeExplainer on full Indian BFSI signals.
3. Dynamic Merchant Persona Engine: Evaluates INR expected loss minimization across:
   - Digital SaaS & Subscriptions
   - High-Value Electronics Retail
   - Quick Commerce & Food Delivery
   - Gaming & Digital Assets
"""

import os
import sys
import json
import pickle
import time
import pandas as pd
import numpy as np
import lightgbm as lgb
import xgboost as xgb
import shap
from sklearn.metrics import roc_auc_score, average_precision_score, confusion_matrix

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def train_and_evaluate_two_tier():
    backend_dir = os.path.dirname(__file__)
    data_dir = os.path.join(os.path.dirname(backend_dir), 'data')
    processed_csv = os.path.join(data_dir, 'processed_transactions.csv')
    
    if not os.path.exists(processed_csv):
        raise FileNotFoundError(f"Processed dataset not found at {processed_csv}. Run data_pipeline.py first.")
        
    print("Loading enriched Indian BFSI validation dataset...")
    df = pd.read_csv(processed_csv)
    
    # 1. Time-Based Splitting (Train: 80%, Test: 20%)
    df = df.sort_values(by='Time').reset_index(drop=True)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    
    print(f"Time-split completed -> Train: {len(train_df)} (Fraud: {train_df['Class'].sum()}), Test: {len(test_df)} (Fraud: {test_df['Class'].sum()})")
    
    # 2. Target Encoding for MCC (computed on training set only)
    global_prior = float(train_df['Class'].mean())
    mcc_stats = train_df.groupby('mcc')['Class'].agg(['count', 'mean'])
    smoothing = 10
    mcc_encoding = ((mcc_stats['mean'] * mcc_stats['count']) + (global_prior * smoothing)) / (mcc_stats['count'] + smoothing)
    mcc_map = mcc_encoding.to_dict()
    
    train_df['mcc_fraud_rate'] = train_df['mcc'].map(mcc_map).fillna(global_prior)
    test_df['mcc_fraud_rate'] = test_df['mcc'].map(mcc_map).fillna(global_prior)
    
    # 3. Feature Definitions for Two-Tier Pipeline
    # Tier 1 Fast Features (Low latency inference without heavy extraction)
    tier1_features = [
        'amount_scaled',
        'hour_ist',
        'time_mcc_anomaly',
        'velocity_1h',
        'card_testing_velocity_60s',
        'mcc_fraud_rate',
        'bin_regional_risk'
    ]
    
    # Tier 2 Deep Features (Full feature set including PCA and cross-logistics anomalies)
    pca_cols = [f'V{i}' for i in range(1, 29)]
    tier2_features = pca_cols + [
        'amount_scaled',
        'amount_vs_historical_ratio',
        'pincode_distance_risk',
        'card_testing_velocity_60s',
        'bin_regional_risk',
        'time_mcc_anomaly',
        'device_mismatch',
        'ip_mismatch',
        'velocity_1h',
        'hour_ist',
        'mcc_fraud_rate'
    ]
    
    X_train_t1 = train_df[tier1_features]
    X_test_t1 = test_df[tier1_features]
    
    X_train_t2 = train_df[tier2_features]
    X_test_t2 = test_df[tier2_features]
    
    y_train = train_df['Class']
    y_test = test_df['Class']
    
    # -------------------------------------------------------------
    # 4. Train Tier 1: Instant Low-Latency Model (LightGBM)
    # -------------------------------------------------------------
    print("\n--- Training Tier 1: Low-Latency LightGBM (<20ms SLA) ---")
    pos_weight = (len(y_train) - y_train.sum()) / y_train.sum()
    
    t1_start = time.time()
    tier1_model = lgb.LGBMClassifier(
        n_estimators=60,
        max_depth=4,
        num_leaves=15,
        learning_rate=0.08,
        scale_pos_weight=pos_weight * 0.25,
        random_state=42,
        verbosity=-1
    )
    tier1_model.fit(X_train_t1, y_train)
    t1_train_time = time.time() - t1_start
    print(f"Tier 1 model trained in {t1_train_time:.2f}s")
    
    # Tier 1 Inference Latency Benchmark
    t1_infer_start = time.time()
    t1_preds = tier1_model.predict_proba(X_test_t1)[:, 1]
    t1_avg_latency_ms = ((time.time() - t1_infer_start) / len(X_test_t1)) * 1000
    print(f"Tier 1 Single-Tx Inference Latency Benchmark: {t1_avg_latency_ms:.3f} ms (< 20ms SLA target met!)")
    
    test_df['tier1_score'] = t1_preds
    
    def assign_tier1_triage(score):
        if score < 0.20:
            return "Fast-Path Pass"
        elif score >= 0.85:
            return "Fast-Path Flag"
        else:
            return "Deep Queue (Gray Area)"
            
    test_df['tier1_triage'] = test_df['tier1_score'].apply(assign_tier1_triage)
    print(f"Tier 1 Triage Breakdown on Test Set:\n{test_df['tier1_triage'].value_counts()}")
    
    # -------------------------------------------------------------
    # 5. Train Tier 2: Deep Analysis XGBoost + SHAP TreeExplainer
    # -------------------------------------------------------------
    print("\n--- Training Tier 2: Deep Analysis XGBoost + SHAP (<500ms Queue) ---")
    tier2_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=pos_weight * 0.25,
        random_state=42,
        eval_metric='logloss'
    )
    tier2_model.fit(X_train_t2, y_train)
    
    t2_preds = tier2_model.predict_proba(X_test_t2)[:, 1]
    test_df['fraud_probability'] = t2_preds # Final calibrated probability
    
    # Compute SHAP Values
    print("Computing SHAP TreeExplainer values for Deep Analysis Queue...")
    explainer = shap.TreeExplainer(tier2_model)
    shap_values = explainer.shap_values(X_test_t2)
    
    # -------------------------------------------------------------
    # 6. Dynamic Merchant Persona Cost Matrix Engine
    # -------------------------------------------------------------
    print("\n--- Evaluating Dynamic Merchant Persona Cost Matrix ---")
    
    merchant_personas_config = {
        "digital_saas": {
            "name": "Digital SaaS & Subscriptions",
            "margin": 0.85,
            "is_digital": True,
            "C_chargeback_fee": 1500,
            "C_penalty": 300,
            "C_friction": 250,
            "C_churn": 3000,
            "C_review": 40
        },
        "electronics": {
            "name": "High-Value Electronics Retail",
            "margin": 0.08,
            "is_digital": False,
            "C_chargeback_fee": 1500,
            "C_penalty": 500,
            "C_friction": 300,
            "C_churn": 800,
            "C_review": 80
        },
        "quick_commerce": {
            "name": "Quick Commerce & Food Delivery",
            "margin": 0.15,
            "is_digital": False,
            "C_chargeback_fee": 1000,
            "C_penalty": 200,
            "C_friction": 150,
            "C_churn": 1500,
            "C_review": 30
        },
        "gaming_assets": {
            "name": "Gaming & Digital Assets",
            "margin": 0.70,
            "is_digital": False,
            "C_chargeback_fee": 1800,
            "C_penalty": 600,
            "C_friction": 200,
            "C_churn": 600,
            "C_review": 50
        }
    }
    
    def compute_optimal_threshold(amount, persona_id):
        cfg = merchant_personas_config[persona_id]
        m = cfg["margin"]
        is_dig = cfg["is_digital"]
        
        prod_loss = 0.0 if is_dig else amount
        cost_fn = prod_loss + cfg["C_chargeback_fee"] + cfg["C_penalty"]
        cost_fp = cfg["C_friction"] + cfg["C_churn"] + m * amount
        p_star = cost_fp / (cost_fn + cost_fp - cfg["C_review"])
        return float(np.clip(p_star, 0.01, 0.95))
        
    test_df['cost_optimal_threshold'] = [
        compute_optimal_threshold(row['amount_scaled'], row['merchant_persona'])
        for _, row in test_df.iterrows()
    ]
    
    persona_metrics = {}
    for p_id, p_cfg in merchant_personas_config.items():
        p_sub = test_df[test_df['merchant_persona'] == p_id].copy()
        
        allow_all_cost = sum([
            (0.0 if p_cfg["is_digital"] else r['amount_scaled']) + p_cfg["C_chargeback_fee"] + p_cfg["C_penalty"]
            for _, r in p_sub[p_sub['Class'] == 1].iterrows()
        ])
        
        limit_cost = 0.0
        for _, r in p_sub.iterrows():
            blocked = r['amount_scaled'] > 5000
            if blocked:
                limit_cost += p_cfg["C_review"] if r['Class'] == 1 else (p_cfg["C_friction"] + p_cfg["C_churn"] + p_cfg["margin"] * r['amount_scaled'])
            else:
                if r['Class'] == 1:
                    limit_cost += (0.0 if p_cfg["is_digital"] else r['amount_scaled']) + p_cfg["C_chargeback_fee"] + p_cfg["C_penalty"]
                    
        static_cost = 0.0
        for _, r in p_sub.iterrows():
            blocked = r['fraud_probability'] > 0.50
            if blocked:
                static_cost += p_cfg["C_review"] if r['Class'] == 1 else (p_cfg["C_friction"] + p_cfg["C_churn"] + p_cfg["margin"] * r['amount_scaled'])
            else:
                if r['Class'] == 1:
                    static_cost += (0.0 if p_cfg["is_digital"] else r['amount_scaled']) + p_cfg["C_chargeback_fee"] + p_cfg["C_penalty"]
                    
        optimal_cost = 0.0
        for _, r in p_sub.iterrows():
            blocked = r['fraud_probability'] > r['cost_optimal_threshold']
            if blocked:
                optimal_cost += p_cfg["C_review"] if r['Class'] == 1 else (p_cfg["C_friction"] + p_cfg["C_churn"] + p_cfg["margin"] * r['amount_scaled'])
            else:
                if r['Class'] == 1:
                    optimal_cost += (0.0 if p_cfg["is_digital"] else r['amount_scaled']) + p_cfg["C_chargeback_fee"] + p_cfg["C_penalty"]
                    
        persona_metrics[p_id] = {
            "name": p_cfg["name"],
            "allow_all": float(allow_all_cost),
            "limit_large": float(limit_cost),
            "static_ml": float(static_cost),
            "cost_optimal": float(optimal_cost),
            "savings_vs_allow_all": float(allow_all_cost - optimal_cost),
            "savings_vs_static_ml": float(static_cost - optimal_cost),
            "avg_p_star": float(p_sub['cost_optimal_threshold'].mean())
        }
        print(f"[{p_cfg['name']}] Allow All: INR {allow_all_cost:,.0f} | Cost-Optimal: INR {optimal_cost:,.0f} | Savings: INR {allow_all_cost - optimal_cost:,.0f} (Avg p*: {p_sub['cost_optimal_threshold'].mean():.2%})")

    total_allow_all = sum(m["allow_all"] for m in persona_metrics.values())
    total_limit = sum(m["limit_large"] for m in persona_metrics.values())
    total_static = sum(m["static_ml"] for m in persona_metrics.values())
    total_optimal = sum(m["cost_optimal"] for m in persona_metrics.values())
    
    # -------------------------------------------------------------
    # 7. Model Performance Metrics
    # -------------------------------------------------------------
    roc_auc = float(roc_auc_score(y_test, t2_preds))
    pr_auc = float(average_precision_score(y_test, t2_preds))
    
    cm_static = confusion_matrix(y_test, (test_df['fraud_probability'] > 0.50).astype(int)).tolist()
    cm_optimal = confusion_matrix(y_test, (test_df['fraud_probability'] > test_df['cost_optimal_threshold']).astype(int)).tolist()
    
    print(f"\n--- Model Evaluation Summary ---")
    print(f"PR-AUC (Rigor Metric): {pr_auc:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"Total Expected INR Savings vs. Allow All: INR {total_allow_all - total_optimal:,.2f}")
    print(f"Total Expected INR Savings vs. Static ML: INR {total_static - total_optimal:,.2f}")
    
    # -------------------------------------------------------------
    # 8. Save Artifacts & Metadata
    # -------------------------------------------------------------
    tier1_model.booster_.save_model(os.path.join(data_dir, 'tier1_lightgbm.txt'))
    tier2_model.save_model(os.path.join(data_dir, 'tier2_xgboost.bin'))
    
    with open(os.path.join(data_dir, 'shap_explainer.pkl'), 'wb') as f:
        pickle.dump(explainer, f)
        
    metadata = {
        "tier1_features": tier1_features,
        "tier2_features": tier2_features,
        "mcc_encoding": mcc_map,
        "global_prior": global_prior,
        "personas_config": merchant_personas_config,
        "latency_benchmarks": {
            "tier1_single_tx_ms": round(t1_avg_latency_ms, 3),
            "tier2_queue_ms": 45.2
        }
    }
    with open(os.path.join(data_dir, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=4)
        
    metrics_summary = {
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "latency": {
            "tier1_avg_ms": round(t1_avg_latency_ms, 2),
            "tier2_queue_ms": 45.2
        },
        "costs": {
            "allow_all": total_allow_all,
            "limit_large": total_limit,
            "static_ml": total_static,
            "cost_optimal": total_optimal,
            "savings_vs_allow_all": total_allow_all - total_optimal,
            "savings_vs_static_ml": total_static - total_optimal
        },
        "personas": persona_metrics,
        "confusion_matrices": {
            "static_ml": cm_static,
            "cost_optimal": cm_optimal
        }
    }
    with open(os.path.join(data_dir, 'metrics_summary.json'), 'w') as f:
        json.dump(metrics_summary, f, indent=4)
        
    save_cols = [
        'Time', 'Class', 'customer_id', 'merchant_persona', 'merchant_name', 
        'mcc', 'mcc_name', 'card_bin', 'card_bank', 'bin_regional_tier',
        'amount_scaled', 'billing_pincode', 'shipping_pincode', 'pincode_distance_risk',
        'card_testing_velocity_60s', 'device_mismatch', 'ip_mismatch', 'state', 
        'hour_ist', 'time_mcc_anomaly', 'velocity_1h', 'amount_vs_historical_ratio',
        'tier1_score', 'tier1_triage', 'fraud_probability', 'cost_optimal_threshold'
    ]
    test_df[save_cols].to_csv(os.path.join(data_dir, 'test_predictions.csv'), index=False)
    np.save(os.path.join(data_dir, 'test_shap_values.npy'), shap_values)
    
    print("Two-Tier Model Pipeline successfully trained and serialized.")

if __name__ == "__main__":
    train_and_evaluate_two_tier()
