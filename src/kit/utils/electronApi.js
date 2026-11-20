export function getElectronApi() {
    if (typeof window === "undefined") {
        throw new Error("Electron API is not available outside the desktop app.");
    }

    const api = window.api;
    if (!api) {
        throw new Error(
            "Electron API is not available. Restart the Allrounder desktop app."
        );
    }

    return api;
}

export function requireElectronMethod(methodName) {
    const api = getElectronApi();
    const method = api[methodName];

    if (typeof method !== "function") {
        throw new Error(
            `Electron API method "${methodName}" is not available. Restart the app and try again.`
        );
    }

    return method.bind(api);
}

export function printToDefaultPrinter() {
    return requireElectronMethod("printInvoice")();
}
