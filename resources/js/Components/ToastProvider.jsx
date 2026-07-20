import { createContext, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts([{ id, message, type }]);

        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 2000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rounded-lg border px-4 py-3 shadow-lg ${
                            toast.type === 'error'
                                ? 'border-red-200 bg-red-50 text-red-800'
                                : 'border-green-200 bg-green-50 text-green-800'
                        }`}
                    >
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                ))}
            </div>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}
