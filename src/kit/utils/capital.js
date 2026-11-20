export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const initialLettersCapitalize = (str) =>
    str
        ?.toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");