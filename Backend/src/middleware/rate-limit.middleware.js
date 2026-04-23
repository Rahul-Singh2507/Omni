const stores = new Map();

function getClientKey(req) {
    const forwardedFor = req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
        return forwardedFor.split(",")[ 0 ].trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRateLimit({
    windowMs,
    max,
    message,
}) {
    return function rateLimit(req, res, next) {
        const now = Date.now();
        const key = `${req.method}:${req.baseUrl}${req.path}:${getClientKey(req)}`;
        const existing = stores.get(key);

        if (!existing || existing.expiresAt <= now) {
            stores.set(key, {
                count: 1,
                expiresAt: now + windowMs,
            });

            return next();
        }

        if (existing.count >= max) {
            const retryAfter = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
            res.set("Retry-After", String(retryAfter));

            return res.status(429).json({
                message,
                success: false,
            });
        }

        existing.count += 1;
        stores.set(key, existing);

        next();
    };
}
