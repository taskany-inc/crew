import { config } from '../config';

export const constructLinkToHireStream = (hireStreamId: number) =>
    `${config.hireIntegration.apiUrl}/hire-streams/${hireStreamId}`;
