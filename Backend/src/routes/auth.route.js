import { Router } from "express";
import { register, verifyEmail, login, getMe } from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { authUser } from "../middleware/auth.middleware.js";
import { createRateLimit } from "../middleware/rate-limit.middleware.js";

const authRouter = Router();
const authLimiter = createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts. Please try again later."
});
const verifyEmailLimiter = createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many verification attempts. Please try again later."
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @body { username, email, password }
 */
authRouter.post("/register", authLimiter, registerValidator, register);


/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 * @body { email, password }
 */
authRouter.post("/login", authLimiter, loginValidator, login)



/**
 * @route GET /api/auth/get-me
 * @desc Get current logged in user's details
 * @access Private
 */
authRouter.get('/get-me', authUser, getMe)

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user's email address
 * @access Public
 * @query { token }
 */
authRouter.get('/verify-email', verifyEmailLimiter, verifyEmail)

export default authRouter;
