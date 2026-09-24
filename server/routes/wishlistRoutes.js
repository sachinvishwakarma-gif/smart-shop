const router = require("express").Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.get("/", getWishlist);
router.post("/:productId", validateId("productId"), addToWishlist);
router.delete("/:productId", validateId("productId"), removeFromWishlist);

module.exports = router;