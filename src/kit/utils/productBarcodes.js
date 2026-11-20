export function getProductBarcodes(product) {
    const entries = [
        product.barcode,
        product.EANCode,
        product.inventory?.EANCode,
        ...(Array.isArray(product.barcodes) ? product.barcodes : []),
        ...(Array.isArray(product.inventory?.barcodes) ? product.inventory.barcodes : []),
    ];

    return entries
        .flatMap((entry) => String(typeof entry === "string" ? entry : entry?.barcode ?? "").split(","))
        .map((barcode) => barcode.trim().toLowerCase())
        .filter(Boolean);
}
