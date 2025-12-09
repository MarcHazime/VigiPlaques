export const COLORS = {
    primary: '#F97316', // Orange / Sunset (Vibrant, Alert, Friendly)
    primaryGradient: ['#F97316', '#EA580C'] as const, // Orange Gradient
    secondary: '#1E293B', // Deep Navy (Trust, Contrast)
    accent: '#3B82F6', // Blue 500 (Action alternative)
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    text: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    border: '#E2E8F0', // Slate 200
    error: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const RADIUS = {
    s: 12,
    m: 16,
    l: 24,
    full: 9999,
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
};
