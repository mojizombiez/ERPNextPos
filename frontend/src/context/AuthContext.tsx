import React, { createContext, useContext, useState, useEffect } from 'react';

interface Staff {
    id: number;
    name: string;
    nickName: string;
    role: string;
}

interface AuthContextType {
    currentUser: Staff | null;
    login: (staff: Staff) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse currentUser", e);
            }
        }
        return null;
    });

    const login = (staff: Staff) => {
        setCurrentUser(staff);
        localStorage.setItem('currentUser', JSON.stringify(staff));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
