const router = require("express").Router();
const { listProducts, listCategories, getProduct } = require("../controllers/productController");
const validateId = require("../middleware/validateId");

router.get("/", listProducts);
router.get("/categories", listCategories); // /:id se pehle hona zaroori hai
router.get("/:id", validateId(), getProduct);

module.exports = router;