import СyrillicToTranslit from 'cyrillic-to-translit-js';
import { UserCreationRequest } from '@prisma/client';

interface LoginAutoType {
    firstName?: string;
    middleName?: string;
    surname?: string;
}

export const loginAuto = ({ firstName, middleName, surname = '' }: LoginAutoType) => {
    const translit = СyrillicToTranslit();
    const login = (firstName?.slice(0, 1) || '') + (middleName?.slice(0, 1) || '') + surname;
    return translit.transform(login, 'en').toLowerCase();
};

export const userCreationRequestPhone = (request: UserCreationRequest) =>
    (request.services as Record<'serviceName' | 'serviceId', string>[]).find(
        (service) => service.serviceName === 'Phone',
    )?.serviceId || '';
