import СyrillicToTranslit from 'cyrillic-to-translit-js';
import { UserCreationRequest } from '@prisma/client';

import { UserCreationRequestType } from '../modules/userCreationRequestTypes';
import { pages } from '../hooks/useRouter';

import { ExternalServiceName, findService } from './externalServices';

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
    findService(ExternalServiceName.Phone, request.services as Record<'serviceName' | 'serviceId', string>[]) || '';

export const getRequestPageLinkByType = (id: string, type: string | null) => {
    if (type === UserCreationRequestType.transferInternToStaff) return pages.transferInternToStaff(id);
    if (type === UserCreationRequestType.transferInside) return pages.transferInside(id);
    if (type === UserCreationRequestType.createSuppementalPosition) return pages.supplementalPositionRequest(id);
    return pages.internalUserRequest(id);
};
