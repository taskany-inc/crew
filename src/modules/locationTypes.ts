import { locationMethods } from './locationMethods';

export type Location = Awaited<ReturnType<typeof locationMethods.findOrCreate>>;
