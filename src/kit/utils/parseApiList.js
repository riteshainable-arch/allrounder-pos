const LIST_KEYS = ["users", "data", "items", "records", "rows", "list", "results"];

export const parseApiList = (response, keys = LIST_KEYS) => {
    if (!response) return [];

    if (Array.isArray(response)) return response;

    const payload = response.data ?? response;

    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
        if (Array.isArray(payload?.[key])) return payload[key];
    }

    if (payload?.data && typeof payload.data === "object") {
        if (Array.isArray(payload.data)) return payload.data;

        for (const key of keys) {
            if (Array.isArray(payload.data[key])) return payload.data[key];
        }
    }

    return [];
};

export const buildUserLabel = (user = {}) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) return name;
    return user.email || user.name || `User #${user.id}`;
};

export const buildCashierNameMap = (users = []) => {
    const map = {};
    (Array.isArray(users) ? users : []).forEach((user) => {
        if (user?.id != null) {
            map[user.id] = buildUserLabel(user);
            map[String(user.id)] = buildUserLabel(user);
        }
    });
    return map;
};
