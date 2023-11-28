import { Nullish } from '../utils/types';

export interface BonusPointsAchievement {
    id: number;
    attributes: {
        title: string;
        description: Nullish<string>;
        bonus: number;
    };
}
