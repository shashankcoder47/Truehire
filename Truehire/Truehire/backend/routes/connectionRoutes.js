const express = require("express");
const { verifyToken, requireUser } = require("../middleware/auth");
const connectionController = require("../controllers/connectionController");

const router = express.Router();

router.post("/connections/send", verifyToken, requireUser, connectionController.sendConnectionRequest);
router.post("/connections/accept/:id", verifyToken, requireUser, connectionController.acceptConnectionRequest);
router.post("/connections/reject/:id", verifyToken, requireUser, connectionController.rejectConnectionRequest);
router.get("/connections/my", verifyToken, requireUser, connectionController.getUserConnections);
router.get("/connections/pending", verifyToken, requireUser, connectionController.getPendingRequests);
router.get("/connections/status/:userId", verifyToken, requireUser, connectionController.getConnectionStatus);

module.exports = router;
