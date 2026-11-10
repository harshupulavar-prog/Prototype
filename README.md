# PrototypeHub

Browse prototype applications, brand one (app name, logo, colors), host it as your own
copy, and open it in VS Code. The copy runs itself when opened.

## Structure

```
backend/      FastAPI service: auth, prototype catalog, hosting, git repos, export
frontend/     React + Vite hub UI (login, catalog, host dialog, my instances)
prototypes/   Source templates, one folder each (banking, crm, hrms, insurance, doc-extraction)
  _runtime/   "Run automatically" kit added to every hosted copy (run.py, VS Code task, Vite scaffold)
generated/    Created at runtime: hosted copies, git repos, exports (gitignored)
docker-compose.yml   Postgres + backend
```

## Run locally

Backend (http://localhost:8000, docs at /docs):
```bash
cd backend
python -m venv venv && venv\Scripts\activate      # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend (http://localhost:5173), in a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Demo login: `demo@prototypehub.io` / `password123`.

## Adding a prototype

Create `prototypes/<id>/` with `prototype.json`, `backend/main.py` (+ `requirements.txt`) and
`frontend/` (`package.json`, `src/App.jsx`). It must read `./branding.json`
(`companyName`, `primaryColor`, `secondaryColor`, `logo`) and pass it to its UI. Restart the backend to register it.
