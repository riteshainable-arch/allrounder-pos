import { useNavigate } from "react-router-dom";

const AccessDenied = ({ message }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="max-w-lg rounded-2xl bg-white p-8 shadow-xl text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="mb-6 text-sm text-third-800">{message}</p>
                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => navigate("/")}
                >
                    Back to login
                </button>
            </div>
        </div>
    );
};

export default AccessDenied;
