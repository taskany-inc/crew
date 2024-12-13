import { translit } from '@taskany/bricks';
import { UserCreationRequest } from '@prisma/client';

interface LoginAutoType {
    firstName?: string;
    middleName?: string;
    surname?: string;
}

export const loginAuto = ({ firstName, middleName, surname = '' }: LoginAutoType) => {
    const login = (firstName?.slice(0, 1) || '') + (middleName?.slice(0, 1) || '') + surname;
    return translit(login, 'en').toLowerCase();
};

export const userCreationRequestPhone = (request: UserCreationRequest) =>
    (request.services as Record<'serviceName' | 'serviceId', string>[]).find(
        (service) => service.serviceName === 'Phone',
    )?.serviceId || '';
