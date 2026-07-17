const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { validate, asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");

// ─── Auth Routes (públicas) ─────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Authenticates a user and returns a JWT token.
 */
router.post(
  "/login",
  validate("name", "password"),
  asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    const token = await authService.login(name, password);
    res.status(200).json({ token });
  })
);

/**
 * POST /auth/register
 * Creates a new user account.
 * Required: name, email, password
 * Optional: confirmPassword, organization, role
 */
router.post(
  "/register",
  validate("name", "email", "password"),
  asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, organization, role } = req.body;
    const user = await authService.register({ name, email, password, confirmPassword, organization, role });
    res.status(201).json({ message: "User created successfully", user });
  })
);

/**
 * POST /auth/logout
 * Invalidates the current session/token.
 */
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    await authService.logout(token);
    res.status(200).json({ message: "Logged out successfully" });
  })
);

/**
 * POST /auth/refresh
 * Issues a new access token from a valid refresh token.
 */
router.post(
  "/refresh",
  validate("refreshToken"),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const token = await authService.refreshToken(refreshToken);
    res.status(200).json({ token });
  })
);

/**
 * POST /auth/forgot-password
 * Sends a password reset link to the user's email.
 */
router.post(
  "/forgot-password",
  validate("email"),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.sendPasswordReset(email);
    res.status(200).json({ message: "Password reset email sent" });
  })
);

/**
 * POST /auth/reset-password
 * Resets a user's password using a valid reset token.
 */
router.post(
  "/reset-password",
  validate("token", "newPassword"),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: "Password updated successfully" });
  })
);

// ─── User Routes (protegidas — exigem token válido) ─────────────────────────────

/**
 * GET /auth/users
 * Returns a paginated list of users. Supports ?page, ?limit, ?search query params.
 */
router.get(
  "/users",
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "" } = req.query;
    const result = await authService.findUsers({
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
      search: search.trim(),
    });
    res.status(200).json(result);
  })
);

/**
 * GET /auth/users/:id
 * Returns a single user by ID.
 */
router.get(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  })
);

/**
 * PATCH /auth/users/:id
 * Partially updates a user's profile (name, email, organization, role).
 */
router.patch(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const allowedFields = ["name", "email", "organization", "role"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (!Object.keys(updates).length) {
      return res
        .status(400)
        .json({ error: `At least one of [${allowedFields.join(", ")}] is required` });
    }

    const user = await authService.updateUser(req.params.id, updates);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User updated", user });
  })
);

/**
 * DELETE /auth/users/:id
 * Soft-deletes or permanently removes a user by ID.
 */
router.delete(
  "/users/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const deleted = await authService.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  })
);

// ─── Error Handler ─────────────────────────────────────────────────────────────

router.use(authErrorHandler);

module.exports = router;