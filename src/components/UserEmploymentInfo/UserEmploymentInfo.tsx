import { FC, HTMLAttributes, useMemo } from 'react';
import cn from 'classnames';

import { UserWithSuplementalPositions } from '../../modules/userTypes';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { UserContacts } from '../UserContactsV2/UserContactsV2';

import { tr } from './UserEmploymentInfo.i18n';
import s from './UserEmploymentInfo.module.css';

interface UserEmploymentInfoProps extends HTMLAttributes<HTMLDivElement> {
    user: UserWithSuplementalPositions;
}

export const UserEmploymentInfo: FC<UserEmploymentInfoProps> = ({ user, className, ...props }) => {
    const mainPosition = useMemo(() => {
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions.find((item) => item.main);
    }, [user]);

    return (
        <div className={cn(s.UserEmploymentInfo, className)} {...props}>
            <div className={s.UserEmploymentTitle}>
                {tr.raw('Employment at {organizationName}', { organizationName: mainPosition?.organizationUnit.name })}
            </div>
            <UserContacts user={user} size="m" />
        </div>
    );
};
