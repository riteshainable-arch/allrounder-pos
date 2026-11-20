import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../kit/components/KitSelect";
import { Role } from "../../../../kit/configs/general";
import { toast } from "react-toastify";
import { useEffect, useRef } from "react";

export const POS_ROLE_OPTIONS = [
    { label: "Cashier", value: Role.CASHIER },
    { label: "Manager", value: Role.MANAGER },
];

const userSchema = yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().nullable(),
    email: yup.string().email("Enter valid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    role: yup
        .string()
        .oneOf([Role.MANAGER, Role.CASHIER], "Select a valid role")
        .required("Role is required"),
});

export default function UserFormModal({ open, onClose, onCreateUser, isSaving, cashierOnly = false }) {
    const submitButtonRef = useRef(null);
    const firstNameRef = useRef(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: Role.CASHIER,
        },
        resolver: yupResolver(userSchema),
    });

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const onSubmit = async (values) => {
        try {
            await onCreateUser({
                firstName: values.firstName,
                lastName: values.lastName || "",
                email: values.email,
                password: values.password,
                role: cashierOnly ? Role.CASHIER : values.role,
            });
            toast.success("User created successfully");
            handleClose();
        } catch (error) {
            toast.error(error?.message || "Unable to create user");
        }
    };

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                submitButtonRef.current?.click();
            }

            if (e.key === "Escape") {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            firstNameRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [open]);

    return (
        <KitModal
            maxWidth="sm"
            isOpen={open}
            onClose={handleClose}
            title={<div className="text-base font-semibold">{cashierOnly ? "Add Cashier" : "Add User"}</div>}
            titleClass="p-3! border-b"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-3">
                <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                        <KitTextField
                            inputRef={firstNameRef}
                            fullWidth
                            size="small"
                            label="First Name"
                            placeholder="Enter first name"
                            placeholderFontSize={14}
                            value={field.value}
                            onChange={field.onChange}
                            error={Boolean(errors.firstName)}
                            helperText={errors.firstName?.message}
                        />
                    )}
                />
                <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                        <KitTextField
                            fullWidth
                            size="small"
                            label="Last Name"
                            placeholder="Enter last name"
                            placeholderFontSize={14}
                            value={field.value}
                            onChange={field.onChange}
                            error={Boolean(errors.lastName)}
                            helperText={errors.lastName?.message}
                        />
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <KitTextField
                            fullWidth
                            size="small"
                            label="Email"
                            placeholder="Enter email"
                            placeholderFontSize={14}
                            value={field.value}
                            onChange={field.onChange}
                            error={Boolean(errors.email)}
                            helperText={errors.email?.message}
                        />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <KitTextField
                            fullWidth
                            size="small"
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            placeholderFontSize={14}
                            value={field.value}
                            onChange={field.onChange}
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                        />
                    )}
                />
                {!cashierOnly && (
                    <Controller
                        name="role"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <KitSelect
                                label="Role"
                                placeholder="Select Role"
                                size="small"
                                options={POS_ROLE_OPTIONS}
                                value={POS_ROLE_OPTIONS.find((option) => option.value === value) ?? null}
                                onChange={(option) => onChange(option?.value || Role.CASHIER)}
                                error={Boolean(errors.role)}
                                helpText={errors.role?.message}
                            />
                        )}
                    />
                )}

                <div className="pt-2 flex justify-end gap-2">
                    <KitButton type="button" variant="outlined" size="small" className="w-auto" onClick={handleClose}>
                        Cancel
                    </KitButton>
                    <KitButton ref={submitButtonRef} type="submit" variant="contained" size="small" className="w-auto" isLoading={isSaving}>
                        Create {cashierOnly ? "Cashier" : "User"}
                    </KitButton>
                </div>
            </form>
        </KitModal>
    );
}
