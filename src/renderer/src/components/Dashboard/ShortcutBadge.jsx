const ShortcutBadge = ({ shortcut, className = "" }) => {
    if (!shortcut) return null;

    return (
        <span className={`absolute -top-5 right-1 rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]! ${className}`}>
            {shortcut}
        </span>
    );
};

export default ShortcutBadge;