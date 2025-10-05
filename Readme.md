## 🧩 Milestone 1 (Unit Tests + CI)
**Member scope – Ridhwan Fadly Saputra**
**Backend:** `updateProfileController`, `getOrdersController`, `getAllOrdersController`, `orderStatusController`
**Frontend:** `pages/user/Orders.js`, `pages/user/Profile.js`

**Approach (principled)**
**Equivalence classes:** Valid vs invalid cases (e.g., password < 6 vs ≥ 6)
**Happy / Sad paths:** Success (200/201) vs failure (400/422) scenarios
**Role-based checks:** User vs admin for `getAllOrders` and `orderStatus`
**Boundary:** Empty orders vs orders with items

**Test files (my scope)**
**Backend:** `controllers/auth.update.unit.test.js`, `controllers/orders.controllers.unit.test.js`
**Frontend:** `client/src/pages/user/Orders.test.js`, `client/src/pages/user/Profile.test.js`

**Statistics (my results)**
Identified: **10** • Automated: **8**
Bugs found: **2** • Fixed: **2**
Coverage (local): Backend **33.6% (overall)** / ~**80% on controllers** • Frontend **93.8%**

**CI**
* GitHub Actions run: https://github.com/cs4218/cs4218-2510-ecom-project-team005/actions/runs/18256103708
* Tag: `ms1`