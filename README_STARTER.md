# Wayhunter Angular — runnable starter (not Admin implementation)
- Angular 22 standalone workspace via official CLI; Node 26.x or supported Node 22.22.3+/24.15+.
- `http://localhost:4200/preview` is **development-only** and includes 17 placeholder Admin modules.
- `/admin` redirects to `/login` unconditionally until M1 implements real auth+RBAC; do NOT bypass this for production.
- M7 owns the shell and dashboard; M1 owns authentication; all other Admin features match their member owner.
- `Check backend /health` sends a real request to http://localhost:5055 (only if Backend is running).
- All feature text clearly identifies placeholders; there are no real KPI values, user records or approval buttons.

```powershell
npm install
npx ng build
npx ng test --watch=false
npx ng serve --port 4200 --open
```
Use `Install-Angular-Starter.ps1`: creates official Angular workspace in temporary directory and safely merges with the existing cloned repository. No Git operations.
