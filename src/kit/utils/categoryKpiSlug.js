/** Safe path segment for /category-kpis/[label] (handles &, spaces, etc.). */
export function encodeCategoryKpiSlug(categoryLabel) {
    return encodeURIComponent(String(categoryLabel ?? "").trim());
}

/** Restore category name from route param (supports legacy hyphen-only slugs). */
export function decodeCategoryKpiSlug(slug) {
    const raw = String(slug ?? "").trim();
    if (!raw) return "";

    let decoded = raw;
    try {
        if (raw.includes("%")) {
            decoded = decodeURIComponent(raw);
        }
    } catch {
        decoded = raw.replace(/%26/gi, "&");
    }

    if (decoded.includes("%26")) {
        decoded = decoded.replace(/%26/gi, "&");
    }

    if (!decoded.includes(" ") && decoded.includes("-")) {
        return decoded.replace(/-/g, " ");
    }

    return decoded;
}
