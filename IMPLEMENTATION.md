# PrototypeHub: Implementation Guide

How PrototypeHub is built, how prototypes are stored and hosted, how a hosted copy reaches VS Code, and what must change before production.

---

## 1. Overview

PrototypeHub is a Kaara-branded portal. A signed-in user:

1. Browses a catalog of ready-made prototypes.
2. Sets an app name, logo and colors in a host dialog (with a live preview).
3. Hosts the prototype, which creates a private copy for that user.
4. Opens the copy in VS Code, where it installs and starts itself.

## 2. Architecture

| Part | Location | Stack | Role |
|---|---|---|---|
| Hub frontend | `frontend/` | React, Vite, Tailwind, Lucide | Login, catalog, details, host dialog, My Instances |
| Hub backend | `backend/` | FastAPI, SQLAlchemy | Auth, prototype registry, hosting, git repos, export |
| Prototypes | `prototypes/` | React + FastAPI (one is front-end only) | Source templates that users host |
| Runtime data | `generated/`, `prototypehub.db` | Files, SQLite | Hosted copies, git repos, exports (gitignored) |

```
Prototype_POC/
├── backend/
│   └── app/
│       ├── api/        auth, prototypes, hosting, export, health
│       ├── core/       config, security (JWT, password hashing)
│       ├── models/     user, prototype, instance, configuration, export
│       ├── schemas/    request/response models
│       └── services/   prototype_service, hosting_service, branding_service,
│                       git_service, vscode_service, export_service
├── frontend/
│   └── src/
│       ├── pages/        Login, Catalog, PrototypeDetails, MyInstances, HostedPrototype
│       ├── components/   AppShell, HostModal, Logo, ui (buttons, tags, states)
│       └── services/     api, authService, prototypeService, hostingService
├── prototypes/
│   ├── banking/ crm/ hrms/ insurance/ doc-extraction/
│   ├── Nexus-demo-front-end/
│   └── _runtime/        run-automatically kit added to every hosted copy
├── generated/           created at runtime
└── docker-compose.yml   Postgres + backend
```

## 3. How prototypes are stored as folders

Every prototype is one folder in `prototypes/`. A folder is registered only if it contains a `prototype.json`.

### Standard prototype
```
prototypes/crm/
├── prototype.json
├── README.md
├── backend/    main.py, requirements.txt
└── frontend/   package.json, src/App.jsx
```

### `prototype.json`

```json
{
  "id": "crm",
  "name": "DealFlow Enterprise CRM",
  "description": "…",
  "category": "CRM & Sales",
  "version": "4.0.1",
  "technologies": ["React", "FastAPI"],
  "features": ["…"]
}
```

Optional fields for prototypes that do not follow the standard shape:

```json
{
  "layout": {
    "frontend_dir": "app",
    "backend_dir": null,
    "scaffold": false,
    "exclude": ["built-website", "FRONT-END-AND-BACK-END.md"]
  },
  "branding_fields": ["app_name", "logo", "primary_color"]
}
```

| Field | Meaning | Default |
|---|---|---|
| `layout.frontend_dir` | Folder that holds the frontend | `frontend` |
| `layout.backend_dir` | Folder that holds the FastAPI backend, or `null` for none | `backend` |
| `layout.scaffold` | Add the Vite/Tailwind scaffold if the prototype lacks one | `true` |
| `layout.exclude` | Top-level files or folders left out of hosted copies | none |
| `branding_fields` | Which inputs the host dialog shows | all four |

### Registration
At backend startup, `PrototypeRegistryService.sync_prototypes_from_disk` scans `prototypes/`, reads each `prototype.json`, and creates or updates a row in the `prototypes` table. **To add a prototype: add a folder with a `prototype.json`, then restart the backend.** Folders without a `prototype.json` (such as `_runtime/`) are ignored.

### What a prototype must support for branding
A prototype reads `src/branding.json` (inside its frontend folder) and applies it:

```json
{ "companyName": "…", "primaryColor": "#RRGGBB", "secondaryColor": "#RRGGBB", "logo": "/logo.png" }
```

Every key is optional. The five standard prototypes pass this to their UI. Nexus reads it in `app/src/settings.js` as fallbacks behind its own URL settings.

## 4. The hosting flow

`POST /api/hosting/create` with `{ prototype_id, customization }` runs `HostingService.create_hosted_instance`:

1. **Validate** the customization (`BrandingService.validate`) before touching disk.
   - Colors must be `#RRGGBB`.
   - The logo must be a PNG, JPEG or WebP data URL of 1 MB or less. SVG is rejected because it can carry scripts.
   - App name is 60 characters at most. Bad input returns HTTP 422.
2. **Copy** the prototype to `generated/hosted-instances/<instance-id>/<prototype-slug>/`.
   - The slug is the lower-cased prototype name, for example `dealflow-enterprise-crm`.
   - Excluded: `.git`, `node_modules`, `__pycache__`, `.venv`, `venv`, `.env`, `dist`, `build`, plus the prototype's own `layout.exclude`.
3. **Add the run kit** from `prototypes/_runtime/` (never overwriting files the prototype ships).
4. **Apply branding**: write `<frontend_dir>/src/branding.json`, save the logo to `<frontend_dir>/public/logo.<ext>`, and set the page title.
5. **Record choices** in `customization.json` and the `configurations` table. The base64 logo is not stored there, only a `has_logo` flag.
6. **Provision git**: `git init` in the copy, commit, create a bare repo at `generated/git-repos/<instance-id>/<prototype-slug>.git`, add it as `origin`, and push.
7. **Save** a `hosted_instances` row and return the instance with its VS Code links and clone command.

If any step fails, the instance folder is removed and the database transaction is rolled back.

### API reference

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Sign in, returns a JWT |
| GET | `/api/prototypes` | List prototypes (`category`, `search`) |
| GET | `/api/prototypes/{id}` | Prototype details |
| POST | `/api/hosting/create` | Host a prototype |
| GET | `/api/hosting/my-instances` | The user's instances |
| GET | `/api/hosting/{instance_id}` | One instance |
| GET | `/api/hosting/{instance_id}/clone-info` | Clone URL, VS Code links |
| POST | `/api/hosting/{instance_id}/open-in-vscode` | Open the copy in VS Code on the backend's machine |
| POST | `/api/export/{instance_id}` | Build a downloadable zip |
| GET | `/api/export/download/{file}` | Download the zip |

Interactive docs: http://localhost:8000/docs

## 5. How the copy reaches VS Code

| Method | How it works | Limit |
|---|---|---|
| Open in VS Code button | The backend runs `code -n "<copy folder>"` | Works only if the backend runs on the user's own machine |
| Clone link | `vscode://vscode.git/clone?url=<repo url>` starts a clone in VS Code | The repo URL must be reachable from the user's machine (see section 8) |
| Zip download | The copy, without `.git`, as a `.zip` | None |

Each hosted copy contains only that prototype's files. No hub code is in it.

## 6. Running a hosted copy automatically

Every hosted copy gets this kit from `prototypes/_runtime/`:

| File | Purpose |
|---|---|
| `.vscode/tasks.json` | Runs `python run.py` automatically when the folder is opened |
| `run.py` | Installs dependencies and starts both servers |
| `run.json` | Tells `run.py` where the frontend and backend are |
| `.gitignore` | Ignores `.venv`, `node_modules`, caches and build output |
| README section | "How to run" instructions at the top of the copy's README |
| Vite/Tailwind scaffold | `index.html`, `main.jsx`, configs (only if the prototype has none) |

`run.py`:
- Creates `backend/.venv` and installs `requirements.txt` (only when it changes).
- Runs `npm install` (only when `package.json` changes).
- Finds free ports (backend from 8001, frontend from 5174), starts both, and opens the browser.
- Skips the backend when `run.json` says there is none.
- Stops both on Ctrl+C.

**What the user must do:** click **Allow** on VS Code's "automatic tasks" prompt once. VS Code requires this and a project cannot bypass it. If it does not start, run `python run.py`, or press `Ctrl+Shift+B`.
**Requirements on the user's machine:** Python 3.9+ and Node.js 18+.

## 7. Running the hub locally

Backend (http://localhost:8000):
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend (http://localhost:5173), in a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Demo login: `demo@prototypehub.io` / `password123`. The backend creates the database, the folders under `generated/` and these demo users on first start.

Optional Docker (Postgres + backend): `docker compose up --build`.

## 8. Known drawbacks of the current storage

This is the proof-of-concept design.

1. **A new repo on every Host click.** Code is stored twice (the copy and the bare repo) and nothing is ever deleted.
2. **Repo URLs are local file paths** (`file:///C:/…`), so another person's VS Code cannot clone them.
3. **Open in VS Code works only on the same machine as the backend.**
4. **No access control on the repos.**
5. **Everything lives on one server's disk.** It is lost if the server is replaced and cannot run on several servers.
6. **No quotas, expiry or cleanup.** One user could fill the disk.
7. **Hosting runs inside the web request**, with no background job, retry or real progress.
8. **Weak defaults:** SQLite, seeded demo accounts, a default signing secret, open CORS, and export downloads with no login check.
9. **No live URL.** The hosted copy runs on the user's machine, so the hub cannot show a running address.

## 9. Production plan

1. **Real Git host** (GitHub, GitLab or Gitea). Create a private repo per instance through its API, only when needed. Users clone over `https://` with their own login, and the host handles storage, permissions and backups.
2. **Cloud IDE / devcontainer.** Ship a `.devcontainer/` so one link opens a ready-to-run environment with nothing to install.
3. **Optional live hosting.** Run each instance in a container with a time limit and resource limits, behind its own subdomain, created by a background worker.
4. **Hardening.**
   - Postgres, with secrets in a secret manager.
   - Real sign-in and registration, no seeded accounts.
   - Restricted CORS and HTTPS.
   - Signed, expiring export links.
   - Per-user quotas and rate limits.
   - Audit logs and a job that expires and deletes old instances.

## 10. Before sharing

- **Nexus ICICI build.** `prototypes/Nexus-demo-front-end/app/src/profiles/iciciHfc.js` is client-specific and is included in every hosted copy of Nexus (reachable with `?profile=icici-hfc`). Remove it before anyone other than ICICI gets the code or hosts Nexus.
- **Test data.** `generated/` and `prototypehub.db` may contain test instances. Delete both for a clean start; the backend recreates them.
- **Kaara logo.** The sidebar shows a text wordmark until the real file is placed at `frontend/public/kaara-logo.svg` (or `.png`).

## 11. Tested and not tested

**Tested:** hosting with custom branding, running a hosted copy with `run.py`, the git clone contents, the host dialog in a real browser, and VS Code opening on the copy's folder through the API.
**Not tested:** VS Code's Allow prompt behavior, running every prototype in full (banking, CRM and Nexus were run), and the `vscode://` clone link from a browser.
