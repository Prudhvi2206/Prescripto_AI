import os
import asyncio
from app.services.ai_service import interpret_prescription
from dotenv import load_dotenv
import json

load_dotenv()

sample_ocr = """
Dr. Smith's Clinic
Patient: John Doe
Date: 05/08/2026

Rx:
1. Advil 200mg - Take 2 tablets every 4 hours as needed for pain.
2. Amoxicillin 500mg - 1 capsule three times a day for 7 days.
"""

print("Interpreting prescription and verifying with OpenFDA...")
result_json = asyncio.run(interpret_prescription(sample_ocr))
result = json.loads(result_json)

print("\n--- RESULTS ---")
print(f"Summary: {result.get('summary')}")
print("\nMedicines Found:")
for med in result.get("medicines", []):
    print(f"- {med['name']} ({med['dosage']})")
    print(f"  Verified: {med.get('verified')}")
    if med.get('verified'):
        print(f"  Generic Name: {med.get('generic_name')}")
        print(f"  Official Purpose: {med.get('official_purpose')[:100]}...")
    print(f"  Timing: {med.get('timing')}")

print(f"\nDisclaimer: {result.get('disclaimer')}")
