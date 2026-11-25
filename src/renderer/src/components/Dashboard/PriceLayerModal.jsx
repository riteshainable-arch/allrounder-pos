import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useEffect, useRef } from "react";

export default function PriceLayerModal({
    isOpen,
    onClose,
    priceLayers,
    productName,
    selectedPriceLayerId,
    onSelectedPriceLayerChange,
    onSave,
}) {
    const radioGroupRef = useRef(null);

    const handleSave = () => {
        const selectedLayer = priceLayers.find((layer, index) => String(layer.id ?? index) === selectedPriceLayerId);
        if (!selectedLayer) return;
        onSave(selectedLayer);
    };

    const handleKeyDown = (event) => {
        if (!priceLayers?.length) return;

        const currentIndex = priceLayers.findIndex(
            (layer, index) => String(layer.id ?? index) === selectedPriceLayerId
        );

        if (event.key === "ArrowDown") {
            event.preventDefault();
            const nextIndex = currentIndex < priceLayers.length - 1 ? currentIndex + 1 : 0;
            const nextLayer = priceLayers[nextIndex];
            onSelectedPriceLayerChange(String(nextLayer.id ?? nextIndex));
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            const previousIndex = currentIndex > 0 ? currentIndex - 1 : priceLayers.length - 1;
            const previousLayer = priceLayers[previousIndex];
            onSelectedPriceLayerChange(String(previousLayer.id ?? previousIndex));
        }

        if (event.key === "Enter") {
            event.preventDefault();
            handleSave();
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            const selectedRadio = radioGroupRef.current?.querySelector('input[type="radio"]:checked');
            const firstRadio = radioGroupRef.current?.querySelector('input[type="radio"]');

            (selectedRadio ?? firstRadio)?.focus({ preventScroll: true });
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen, priceLayers]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-semibold text-third-950">Select MRP</div>
                    {productName && <div className="text-xs text-third-500 truncate">{productName}</div>}
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="px-4 py-4">
                <div className="mb-3 text-xs font-medium text-third-500">This product has more than one MRP. Select the MRP you want to add</div>

                <FormControl fullWidth>
                    <RadioGroup
                        ref={radioGroupRef}
                        value={selectedPriceLayerId}
                        onChange={(event) => onSelectedPriceLayerChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        className="outline-none"
                    >
                        <div className="flex flex-col gap-2">
                            {priceLayers.map((layer, index) => {
                                const layerId = String(layer.id ?? index);
                                const selected = selectedPriceLayerId === layerId;

                                return (
                                    <label
                                        key={layerId}
                                        className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-all ${
                                            selected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                                : "border-app-border bg-app-paper hover:border-primary/40 hover:bg-primary/5"
                                        }`}
                                    >
                                        <Radio
                                            size="small"
                                            value={layerId}
                                            checked={selected}
                                            disableRipple
                                            sx={{
                                                pl: 0.25,
                                                "&:hover": {
                                                    backgroundColor: "transparent",
                                                },
                                                "&.Mui-focusVisible": {
                                                    backgroundColor: "transparent",
                                                },
                                                "& .MuiTouchRipple-root": {
                                                    display: "none",
                                                },
                                            }}
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div
                                                    className={`
                                                text-sm font-semibold
                                                ${selected ? "text-primary" : "text-third-950"}
                                            `}
                                                >
                                                    MRP {priceFormat(layer.mrp)}
                                                </div>

                                                {selected && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-third-500">
                                                <span>
                                                    Sale price:{" "}
                                                    <span className="font-medium text-third-700">
                                                        {priceFormat(layer.salePrice)}
                                                    </span>
                                                </span>

                                                <span>
                                                    Stock:{" "}
                                                    <span className="font-medium text-third-700">
                                                        {layer.isPriceOption ? "no stock entry" : (layer.stockQty ?? "-")}
                                                    </span>
                                                </span>

                                                {layer.isDefault && (
                                                    <span className="font-medium text-third-700">Latest MRP</span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </RadioGroup>
                </FormControl>

                <div className="mt-4 flex justify-end gap-2">
                    <KitButton variant="outlined" size="small" onClick={onClose}>
                        Cancel
                    </KitButton>
                    <KitButton variant="contained" size="small" onClick={handleSave} disabled={!selectedPriceLayerId}>
                        Save
                    </KitButton>
                </div>
            </div>
        </KitModal>
    );
}
