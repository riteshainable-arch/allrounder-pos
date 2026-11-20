export const logPosError = async (error, options = {}) => {
    try {
        const errorDetails =
            error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                }
                : {
                    message: String(error),
                };

        if (typeof window.api?.logError !== "function") {
            console.error("POS logger API is unavailable:", error);
            return;
        }

        await window.api.logError({
            type: options.type || "application-error",
            source: options.source || "unknown",
            message: errorDetails.message,
            error: errorDetails,
            details: options.details || null,
        });
    } catch (loggingError) {
        console.error("POS logging failed:", loggingError);
        console.error("Original error:", error);
    }
};