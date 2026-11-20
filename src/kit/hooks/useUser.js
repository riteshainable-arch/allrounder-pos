import storage from "./data/services/storage";

export default function useUser() {
    return storage.getItem("userData") || {};
}