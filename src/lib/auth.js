import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (user) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

export const verifyToken = (token) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const getUser = async () => {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
};

export const requireAuth = async (request) => {
    const user = await getUser();

    if (!user) {
        return Response.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    return user;
}; 