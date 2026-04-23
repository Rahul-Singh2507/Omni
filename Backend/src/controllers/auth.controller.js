import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

function getClientUrl() {
    return process.env.CLIENT_URL || "http://localhost:5173";
}

function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

function isEnabledEnvVar(name, defaultValue = false) {
    const value = process.env[ name ];

    if (value == null) {
        return defaultValue;
    }

    return [ "1", "true", "yes", "on" ].includes(value.trim().toLowerCase());
}

function isEmailVerificationRequired() {
    return isEnabledEnvVar("EMAIL_VERIFICATION_REQUIRED", false);
}


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 * @body { username, email, password }
 */
export async function register(req, res) {

    const { username, email, password } = req.body;
    const requiresEmailVerification = isEmailVerificationRequired();

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { email }, { username } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User with this email or username already exists",
            success: false,
            err: "User already exists"
        })
    }

    const user = await userModel.create({
        username,
        email,
        password,
        verified: !requiresEmailVerification
    });

    if (requiresEmailVerification) {
        const emailVerificationToken = jwt.sign({
            email: user.email,
        }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const serverUrl = `${req.protocol}://${req.get("host")}`;

        try {
            await sendEmail({
                to: email,
                subject: "Welcome to Omni!",
                html: `
                        <p>Hi ${username},</p>
                        <p>Thank you for registering at <strong>Omni</strong>. We're excited to have you on board!</p>
                        <p>Please verify your email address by clicking the link below:</p>
                        <a href="${serverUrl}/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                        <p>If you did not create an account, please ignore this email.</p>
                        <p>Best regards,<br>The Omni Team</p>
                `
            });
        } catch (error) {
            await userModel.findByIdAndDelete(user._id);

            return res.status(500).json({
                message: "Unable to send verification email. Please try again.",
                success: false,
                err: error.message
            });
        }
    }

    res.status(201).json({
        message: requiresEmailVerification
            ? "User registered successfully. Please verify your email before logging in."
            : "User registered successfully",
        success: true,
        requiresEmailVerification,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });



}

/**
 * @desc Login user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 * @body { email, password }
 */
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        })
    }

    if (requiresVerification(user)) {
        return res.status(403).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie("token", token, getCookieOptions())

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @desc Get current logged in user's details
 * @route GET /api/auth/get-me
 * @access Private
 */
export async function getMe(req, res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}


/**
 * @desc Verify user's email address
 * @route GET /api/auth/verify-email
 * @access Public
 * @query { token }
 */
export async function verifyEmail(req, res) {
    const { token } = req.query;

    if (typeof token !== "string" || !token.trim()) {
        return res.status(400).json({
            message: "Verification token is required",
            success: false,
            err: "Missing token"
        });
    }

    try {


        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found"
            })
        }

        user.verified = true;

        await user.save();

        const html =
            `
        <h1>Email Verified Successfully!</h1>
        <p>Your email has been verified. You can now log in to your account.</p>
        <a href="${getClientUrl()}/login">Go to Login</a>
    `

        return res.send(html);
    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
    }
}

function requiresVerification(user) {
    return isEmailVerificationRequired() && !user.verified;
}
