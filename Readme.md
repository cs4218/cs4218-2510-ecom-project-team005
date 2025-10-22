# 🧩 Milestone 1 (Unit Tests + CI)

## CI
* GitHub Actions run: https://github.com/cs4218/cs4218-2510-ecom-project-team005/actions/runs/18256103708
* Tag: `ms1`

## Member scope
We splitted workload according to the recommended scope for a five persion team (4 features each). 
| Name | List of all the files that were tested by this person |
| :--- | :--- |
| **Jakob** | Admin Dashboard, Protected Routes, Product, Contact|
| **Jimmy** | Admin Actions, Admin View Orders, Policy, General|
| **Ridwan** | Order, Profile, Home, Cart|
| **Arda** | Category, Payment, Admin View Product, General|
| **Adnan** | Registration, Login, Admin View Users, Seach|


### Integration testing scope
| Name | List of files by person, integration testing |
| :--- | :--- |
| **Jakob** | productController.integration.test.js (productController.js), brainTreeController.integration.test.js (productController.js)|
| **Jimmy** | admin-category-crud.spec.js |
| **Ridwan** | |
| **Arda** | userModel.integration.test.js, categoryModel.integration.test.js, categoryController.integration.test.js, createProductController.integration.test.js, updateProductController.integration.test.js, deleteProductController.integration.test.js, Categories.integration.test.js, Dashboard.integration.test.js, Products.integration.test.js, Private.integration.test.js |
| **Adnan** | authHelper.integration.test.js, authController.mockDB.integration.test.js, authController.fullDB.integration.test.js

### E2E UI Testing
| Name | List of files by person, integration testing |
| :--- | :--- |
| **Jakob** | category-browsing.test.js, checkout-flow.test.js, product-details.test.js |
| **Jimmy** | admin-category-crud.spec.js, About.spec.js, Footer.spec.js, Header.spec.js, Policy.spec.js |
| **Ridwan** | | 
| **Arda** | order-history.test.js, admin-create-product.test.js, admin-delete-product.test.js, admin-category-crud.test.js, user-profile-update.test.js, logout-session-cleanup.test.js |
| **Adnan** | Register.spec.js, Login.spec.js, auth.e2e.spec.js, search-flow.spec.js
