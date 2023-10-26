import { Device, UserDevice } from 'prisma/prisma-client';

export type UserDeviceInfo = UserDevice & { device: Device };
