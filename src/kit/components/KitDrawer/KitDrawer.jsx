import { Fragment } from "react";
import KitShow from "../KitShow/KitShow";
import KitIcon from "../KitIcon/KitIcon";
import { useTheme } from "@mui/material";

const KitDrawer = ({ isOpen, isOverlap = false, actions, children, onClose, title, headerClass, drawerWidthClass = "w-96" }) => {
     const theme = useTheme();
    return (
        <div
            className={`fixed inset-0 flex items-center justify-end transition-all duration-300 z-drawer no-doc-scroll ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ visibility: isOpen ? "visible" : "hidden" }}
        >
            {/* Overlay */}
            <div className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            ></div>
            {/* Drawer Container */}
            <div
                className={`relative z-50 bg-app-paper rounded-4xl transition-transform duration-300  transform
                             ${drawerWidthClass}
                             ${isOpen ? "translate-x-0" : "translate-x-full"}
                             ${isOverlap ? "max-h-[800px] overflow-y-auto absolute bottom-0" : "h-full"}`}
                style={{
                    boxShadow: theme.palette.customColors.drawerShadow,
                }}
            >
                {/* Header */}
                <div className={`flex sticky top-0 bg-app-paper z-10 left-0 right-0 justify-between items-center border-b border-primaryLight p-6 ${headerClass}`}>
                    <KitShow show={Boolean(typeof title === "string")}>
                        <h2 className="text-lg leading-6 text-black font-semibold" title={title}>
                            {title}
                        </h2>
                    </KitShow>
                    <KitShow show={Boolean(typeof title !== "string")}>{title}</KitShow>
                    <div className="flex space-x-1.5">
                        {/* Actions */}
                        <KitShow show={Boolean(actions)}>
                            <Fragment>{actions}</Fragment>
                        </KitShow>
                        <button
                            type="button"
                            className="text-third rounded-full h-8 w-8 focus:outline-none flex items-center justify-center cursor-pointer"
                            onClick={onClose}
                        >
                            <KitIcon icon="material-symbols:close-rounded" fontSize={18} />
                        </button>
                    </div>
                </div>
                {/* Content */}
                {children}
            </div>
        </div >
    );
};

export default KitDrawer;
