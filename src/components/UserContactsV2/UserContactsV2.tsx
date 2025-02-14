import { ComponentProps, FC, forwardRef, HTMLAttributes, useMemo, useRef } from 'react';
import cn from 'classnames';
import { Text, Tooltip } from '@taskany/bricks/harmony';
import { nullable, useDetectOverflow } from '@taskany/bricks';

import { trpc } from '../../trpc/trpcClient';
import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { ExternalServiceName } from '../../utils/externalServices';
import { getDynamicIcon } from '../../utils/getDynamicIcon';
import { Link } from '../Link';

import s from './UserContactsV2.module.css';

type Size = 'm' | 'l';

const textSizesMap: Record<Size, ComponentProps<typeof Text>['size']> = {
    m: 's',
    l: 'sm',
};

interface ContactItemTextProps extends HTMLAttributes<HTMLDivElement> {
    size: Size;
    text: string;
}

const UserContactsText = forwardRef<HTMLSpanElement, ContactItemTextProps>(({ size, text, ...rest }, ref) => (
    <Text ref={ref} as="span" className={s.UserContactsText} size={textSizesMap[size]} ellipsis {...rest}>
        {text}
    </Text>
));

interface UserContactsItemProps {
    value: string;
    linkPrefix?: string;
    icon: string;
    size?: Size;
}

const UserContactsItem: FC<UserContactsItemProps> = ({ value, linkPrefix, icon, size = 'l' }) => {
    const Icon = getDynamicIcon(icon);
    const ref = useRef<HTMLDivElement>(null);
    const overflow = useDetectOverflow(ref);

    return (
        <div className={s.UserContactsItem}>
            <Icon className={s.UserContactsText} size="s" />
            {nullable(
                linkPrefix,
                (lp) => {
                    return (
                        <Link className={s.UserContactsLink} href={encodeURI(`${lp}${value}`)}>
                            <UserContactsText ref={ref} size={size} text={value} />
                        </Link>
                    );
                },
                <UserContactsText ref={ref} className={s.UserContactsText} size={size} text={value} />,
            )}
            {nullable(overflow, () => (
                <Tooltip className={s.UserContactsItemTooltip} reference={ref} placement="bottom-start">
                    <Text>{value}</Text>
                </Tooltip>
            ))}
        </div>
    );
};

interface UserContactsProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
    size?: Size;
}

export const UserContacts: FC<UserContactsProps> = ({ user, className, size = 'l' }) => {
    const { data = [] } = trpc.service.getUserServices.useQuery(user.id);

    const contacts = useMemo(() => {
        const mm = data.find((service) => service.serviceName === ExternalServiceName.Mattermost);
        const services: UserContactsItemProps[] = [
            {
                value: user.email,
                linkPrefix: 'mailto:',
                icon: 'IconEnvelopeOutline',
            },
        ];

        if (mm) {
            services.push({
                value: mm.serviceId,
                icon: mm.service.icon,
                linkPrefix: mm.service.linkPrefix ?? '',
            });
        }

        return services;
    }, [data, user]);

    return (
        <div
            className={cn(
                s.UserContacts,
                {
                    [s.UserContacts_L]: size === 'l',
                    [s.UserContacts_M]: size === 'm',
                },
                className,
            )}
        >
            {contacts.map((contact, i) => (
                <UserContactsItem key={i} size={size} {...contact} />
            ))}
        </div>
    );
};
