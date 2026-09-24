const router = require("express").Router();
const { createOrder, getMyOrders, getOrder, cancelOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", validateId(), getOrder);
router.put("/:id/cancel", validateId(), cancelOrder);

module.exports = router;