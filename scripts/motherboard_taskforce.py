#!/usr/bin/env python3
import json
import os
import uuid
import logging
from typing import Any, Dict, List

import requests
import psycopg2

DB_CONN_INFO = {
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

SLACK_TOKEN = os.getenv("SLACK_TOKEN")
SLACK_CHANNEL = os.getenv("SLACK_CHANNEL", "#taskforce-status")
SLACK_ERROR_CHANNEL = os.getenv("SLACK_ERROR_CHANNEL", "#taskforce-errors")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

logging.basicConfig(level=logging.INFO)

def log_to_db(record: Dict[str, Any]) -> None:
    if not DB_CONN_INFO.get("host"):
        logging.warning("DB connection info missing; skipping DB log")
        return
    try:
        conn = psycopg2.connect(**DB_CONN_INFO)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''INSERT INTO taskforce_logs (department, task_id, status, payload)
                    VALUES (%s, %s, %s, %s);''',
                    (record["department"], record["task_id"], record["status"], json.dumps(record["payload"]))
                )
        conn.close()
    except Exception as e:
        logging.exception("Failed to log to database: %s", e)
        notify_error(f"DB logging failed: {e}")

def notify_slack(message: str, channel: str = SLACK_CHANNEL) -> None:
    if not SLACK_TOKEN:
        logging.warning("Slack configuration missing; skipping notification")
        return
    try:
        resp = requests.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {SLACK_TOKEN}"},
            json={"channel": channel, "text": message},
        )
        resp.raise_for_status()
    except Exception as e:
        logging.exception("Slack notification failed: %s", e)

def notify_telegram(message: str) -> None:
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        logging.warning("Telegram configuration missing; skipping notification")
        return
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            data={"chat_id": TELEGRAM_CHAT_ID, "text": message},
        )
        resp.raise_for_status()
    except Exception as e:
        logging.exception("Telegram notification failed: %s", e)

def notify_error(message: str) -> None:
    notify_slack(f"Error: {message}", channel=SLACK_ERROR_CHANNEL)
    notify_telegram(f"Error: {message}")

def generate_departments(subject: str, objectives: List[str]) -> Dict[str, List[str]]:
    return {
        "Research": [f"Research best practices for {subject}"] + [f"Analyze objective: {o}" for o in objectives],
        "Planning": [f"Outline project plan for {subject}", f"Break down objectives: {', '.join(objectives)}"],
        "Marketing": ["Create marketing campaign", "Prepare social channels"],
        "Execution": ["Implement workflows", "Monitor performance"],
        "Sales": ["Prepare sales funnel", "Generate leads"],
    }

def build_subflows(departments: Dict[str, List[str]]) -> List[Dict[str, Any]]:
    subflows = []
    for department, tasks in departments.items():
        flow_id = str(uuid.uuid4())
        subflows.append({
            "department": department,
            "task_id": flow_id,
            "webhook_url": f"https://example.com/webhook/{flow_id}",
            "tasks": tasks,
        })
    return subflows

def run(payload: Dict[str, Any]) -> Dict[str, Any]:
    subject = payload.get("subject", "")
    objectives = payload.get("objectives", [])
    notify_slack(f"Initiating Motherboard TaskForce for {subject}")
    departments = generate_departments(subject, objectives)
    subflows = build_subflows(departments)
    result = {"departments": departments, "subflows": subflows}
    for sub in subflows:
        log_to_db({
            "department": sub["department"],
            "task_id": sub["task_id"],
            "status": "created",
            "payload": sub,
        })
    notify_slack(f"TaskForce setup complete for {subject}")
    notify_telegram(f"TaskForce ready: {subject}")
    return result

def main() -> None:
    import argparse, sys
    parser = argparse.ArgumentParser(description="Motherboard TaskForce setup")
    parser.add_argument("--payload", help="JSON payload with subject and objectives")
    args = parser.parse_args()
    data = args.payload or sys.stdin.read()
    payload = json.loads(data)
    output = run(payload)
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    import sys
    try:
        main()
    except Exception as e:
        notify_error(str(e))
        raise
