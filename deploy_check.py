# 🩺 Prescripto AI Pre-Deployment Validator
import os
import sys

# Define Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"

print(f"{BLUE}=============================================={RESET}")
print(f"{BLUE}PRESCRIPTO AI -- PRE-DEPLOYMENT AUDIT SYSTEM{RESET}")
print(f"{BLUE}=============================================={RESET}\n")

passed = True

def log_status(name, is_ok, message):
    global passed
    if is_ok:
        print(f"  [{GREEN}PASS{RESET}] {name}: {message}")
    else:
        print(f"  [{RED}FAIL{RESET}] {name}: {message}")
        passed = False

# 1. Check Backend requirements.txt
req_path = os.path.join("backend", "requirements.txt")
if os.path.exists(req_path):
    with open(req_path, "r", encoding="utf-8") as f:
        reqs = f.read()
    has_fastapi = "fastapi" in reqs.lower()
    has_uvicorn = "uvicorn" in reqs.lower()
    log_status(
        "Backend Packages",
        has_fastapi and has_uvicorn,
        f"requirements.txt contains FastAPI and Uvicorn" if (has_fastapi and has_uvicorn) else "requirements.txt is missing core requirements."
    )
else:
    log_status("Backend Packages", False, "requirements.txt was not found in backend directory.")

# 2. Check Frontend package.json
package_path = os.path.join("frontend", "package.json")
if os.path.exists(package_path):
    with open(package_path, "r", encoding="utf-8") as f:
        pkg = f.read()
    has_next = "next" in pkg.lower()
    log_status("Frontend Packages", has_next, "package.json contains Next.js framework dependency")
else:
    log_status("Frontend Packages", False, "package.json was not found in frontend directory.")

# 3. Check Root Gitignore
gitignore_path = ".gitignore"
if os.path.exists(gitignore_path):
    with open(gitignore_path, "r", encoding="utf-8") as f:
        gi = f.read()
    ignores_env = ".env" in gi
    ignores_db = ".db" in gi or "sql_app.db" in gi
    ignores_node = "node_modules/" in gi
    ignores_venv = "venv/" in gi or "backend/venv/" in gi
    
    is_secure = ignores_env and ignores_db and ignores_node and ignores_venv
    if is_secure:
        log_status("Security Checklist", True, ".gitignore correctly ignores sensitive env keys, databases, venv, and node modules")
    else:
        log_status("Security Checklist", False, f".gitignore is missing critical rules (Env: {ignores_env}, DB: {ignores_db}, Venv: {ignores_venv})")
else:
    log_status("Security Checklist", False, "Global .gitignore was not found in root directory!")

# 4. Check Backend CORS Configuration
main_py_path = os.path.join("backend", "app", "main.py")
if os.path.exists(main_py_path):
    with open(main_py_path, "r", encoding="utf-8") as f:
        main_py = f.read()
    has_cors = "CORSMiddleware" in main_py
    has_env_url = "FRONTEND_URL" in main_py
    
    log_status(
        "Backend CORS Setup",
        has_cors and has_env_url,
        "FastAPI is configured to dynamically accept CORS from FRONTEND_URL environment variable" if (has_cors and has_env_url) else "FastAPI is missing FRONTEND_URL CORS support."
    )
else:
    log_status("Backend CORS Setup", False, "backend/app/main.py was not found.")

# 5. Check Monorepo Directories
has_backend = os.path.isdir("backend")
has_frontend = os.path.isdir("frontend")
log_status(
    "Directory Structure",
    has_backend and has_frontend,
    "Valid monorepo structure with discrete 'backend' and 'frontend' directories"
)

# Output final summary
print(f"\n{BLUE}----------------------------------------------{RESET}")
if passed:
    print(f"{GREEN}STATUS: READY FOR CLOUD DEPLOYMENT!{RESET}")
    print("Both the Next.js Frontend and FastAPI Backend conform to production standards.")
    print("You can proceed to link the GitHub repository to Render and Vercel.")
else:
    print(f"{RED}STATUS: AUDIT FAILED.{RESET}")
    print("Please fix the failed issues listed above before deploying to avoid deployment errors.")
print(f"{BLUE}=============================================={RESET}\n")

if not passed:
    sys.exit(1)
