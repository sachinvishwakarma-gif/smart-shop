const router = require("express").Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.get("/", getCart);
router.post("/", addItem);
router.delete("/", clearCart);
router.put("/:productId", validateId("productId"), updateItem);
router.delete("/:productId", validateId("productId"), removeItem);

module.exports = router;