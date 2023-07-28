import { compare, hash } from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
    return hash(password, 10);
};

export const verifyPassword = async (input: string, hashedPassword: string): Promise<boolean> => {
    return compare(input, hashedPassword);
};
