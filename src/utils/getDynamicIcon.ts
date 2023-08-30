import dynamic from 'next/dynamic';
import { BaseIconProps } from '@taskany/icons';

type DynamicIcon = React.ForwardRefExoticComponent<Omit<BaseIconProps, 'value'> & React.RefAttributes<HTMLSpanElement>>;

export const getDynamicIcon = (iconName: string) => {
    return dynamic(() => import('@taskany/icons').then((module) => module[iconName] as DynamicIcon));
};
