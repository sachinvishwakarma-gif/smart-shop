const router = require("express").Router();
const admin = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect, adminOnly);
router.get("/stats", admin.getStats);
router.get("/products", admin.listAllProducts);
router.post("/products", admin.createProduct);
router.put("/products/:id", validateId(), admin.updateProduct);
router.delete("/products/:id", validateId(), admin.deleteProduct);
router.get("/orders", admin.listOrders);
router.put("/orders/:id/status", validateId(), admin.updateOrderStatus);

module.exports = router;