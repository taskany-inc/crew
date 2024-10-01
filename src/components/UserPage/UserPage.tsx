import { useMemo } from 'react';
import { User } from 'prisma/prisma-client';
import { Text, Button, nullable, Modal } from '@taskany/bricks';
import { gapL, gapS, gapXl, gray10, gray8, textColor } from '@taskany/colors';
import styled from 'styled-components';

import { PageSep } from '../PageSep';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain';
import { UserSummary } from '../UserSummary/UserSummary';
import { UserContacts } from '../UserContacts/UserContacts';
import { UserMembershipsList } from '../UserMembershipsList/UserMembershipsList';
import { UserUpdateForm } from '../UserUpdateForm/UserUpdateForm';
import { UserDevices } from '../UserDevices/UserDevices';
import { UserPic } from '../UserPic';
import { DeactivateProfileForm } from '../DeactivateProfileForm/DeactivateProvileForm';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { usePreviewContext } from '../../contexts/previewContext';
import { UserBonusPoints } from '../UserBonusPoints/UserBonusPoints';
import { UserAchievementList } from '../UserAchievementList/UserAchievementList';
import { UserListItem } from '../UserListItem/UserListItem';
import { NarrowSection } from '../NarrowSection';
import { GroupListItem } from '../GroupListItem';
import { useSessionUser } from '../../hooks/useSessionUser';
import { Restricted } from '../Restricted';
import { ScheduleDeactivationForm } from '../ScheduleDeactivationForm/ScheduleDeactivationForm';
import { useBoolean } from '../../hooks/useBoolean';
import { useUserMutations } from '../../modules/userHooks';
import { UserRoleComboBox } from '../UserRoleComboBox/UserRoleComboBox';
import { Nullish } from '../../utils/types';
import {
    UserAchievements,
    UserMemberships,
    UserMeta,
    UserNames,
    UserOrganizationUnit,
    UserRoleData,
    UserScheduledDeactivations,
    UserSupervisor,
    UserSupervisorIn,
    UserSupervisorOf,
    UserSupplementalPositions,
} from '../../modules/userTypes';
import { ScheduleDeactivateType } from '../../modules/scheduledDeactivationTypes';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../utils/dateTime';
import { supplementPositionListToString } from '../../utils/suplementPosition';
import { getActiveScheduledDeactivation } from '../../utils/getActiveScheduledDeactivation';

import { tr } from './UserPage.i18n';

const StyledHeader = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr max-content;
    gap: ${gapXl};
    padding: 0 ${gapL} ${gapL} ${gapL};
    align-items: end;
`;

const StyledUserNameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapS};
`;

const StyledUserInfoWrapper = styled.div`
    margin-top: ${gapL};
    padding: 0 ${gapL};
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: ${gapL};
    align-items: start;
`;

const StyledLeftPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapL};
`;

const StyledRightPanel = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapL};
`;

const EditButtonsWrapper = styled.div`
    display: flex;
    gap: ${gapS};
`;

const StyledUserListWrapper = styled.div`
    margin-bottom: ${gapS};
`;

interface UserPageInnerProps {
    user: User &
        UserMeta &
        UserNames &
        UserMemberships &
        UserOrganizationUnit &
        UserSupervisor &
        UserRoleData &
        UserAchievements &
        UserSupervisorOf &
        UserSupervisorIn &
        UserScheduledDeactivations &
        UserSupplementalPositions;
}

export const UserPageInner = ({ user }: UserPageInnerProps) => {
    const { editUserRole } = useUserMutations();
    const { showGroupPreview } = usePreviewContext();
    const updateUserFormVisibility = useBoolean(false);
    const deactivateUserFormVisibility = useBoolean(false);
    const scheduleDeactivationFormVisibility = useBoolean(false);
    const sessionUser = useSessionUser();

    const orgMembership = user.memberships.find((m) => m.group.organizational);
    const orgRoles = orgMembership?.roles.map((r) => r.name).join(', ');

    const orgUnitAndRole = useMemo(() => {
        const result: string[] = [];
        if (user.organizationUnit) result.push(user.organizationUnit.name);
        if (orgRoles) result.push(orgRoles);
        return result.join(': ');
    }, [user.organizationUnit, orgRoles]);

    const handleEditUserRole = async (data?: Nullish<{ code: string }>) => {
        if (!data) return;

        await editUserRole({
            id: user.id,
            roleCode: data.code,
        });
    };

    const locale = useLocale();

    const deactivationTypeTr = useMemo<Record<ScheduleDeactivateType, string>>(
        () => ({ retirement: tr('Retirement'), transfer: tr('Transfer') }),
        [],
    );

    const activeScheduledDeactivation = getActiveScheduledDeactivation(user);

    return (
        <LayoutMain pageTitle={user.name}>
            <StyledHeader>
                <UserPic size={150} user={user} />
                <StyledUserNameWrapper>
                    {nullable(orgUnitAndRole, (s) => (
                        <Text size="s" color={gray8} weight="bold">
                            {s}
                        </Text>
                    ))}
                    {nullable(!!user.supplementalPositions.length, () => (
                        <div>
                            <Text size="s" color={gray8}>
                                {tr('Supplemental: ')}
                                {supplementPositionListToString(user.supplementalPositions)}.
                            </Text>
                        </div>
                    ))}

                    {nullable(orgMembership, (m) => (
                        <Link href={pages.team(m.groupId)} onClick={() => showGroupPreview(m.groupId)}>
                            <Text size="l" color={gray10}>
                                {m.group.name}
                            </Text>
                        </Link>
                    ))}

                    {nullable(
                        (sessionUser.role?.editScheduledDeactivation || sessionUser.role?.viewScheduledDeactivation) &&
                            activeScheduledDeactivation,
                        () => (
                            <Text size="s" color={gray8} weight="bold">
                                {deactivationTypeTr[user.scheduledDeactivations[0].type as ScheduleDeactivateType]}{' '}
                                {tr('scheduled on {date}', {
                                    date: formatDate(user.scheduledDeactivations[0].deactivateDate, locale),
                                })}
                            </Text>
                        ),
                    )}
                    <Text size="xxl" weight="bold" color={user.active ? textColor : gray8}>
                        {user.name}
                        {!user.active && tr(' [inactive]')}
                    </Text>
                </StyledUserNameWrapper>
                <Modal visible={updateUserFormVisibility.value} width={600}>
                    <UserUpdateForm user={user} onClose={updateUserFormVisibility.setFalse} />
                </Modal>
                <Modal visible={deactivateUserFormVisibility.value} width={600}>
                    <DeactivateProfileForm user={user} onClose={deactivateUserFormVisibility.setFalse} />
                </Modal>
                <ScheduleDeactivationForm
                    visible={scheduleDeactivationFormVisibility.value}
                    onClose={scheduleDeactivationFormVisibility.setFalse}
                    userId={user.id}
                    orgRoles={orgRoles}
                    organization={user.organizationUnit}
                    orgGroupName={orgMembership?.group.name}
                />
                <EditButtonsWrapper>
                    <Restricted visible={!!sessionUser.role?.editUser}>
                        <Button onClick={updateUserFormVisibility.setTrue} text={tr('Edit')} size="s" />
                    </Restricted>
                    <Restricted visible={!!sessionUser.role?.editUserActiveState}>
                        <Button
                            onClick={deactivateUserFormVisibility.setTrue}
                            text={user.active ? tr('Deactivate') : tr('Reactivate')}
                            view="danger"
                            outline
                            size="s"
                        />
                    </Restricted>
                    <Restricted visible={!activeScheduledDeactivation && !!sessionUser.role?.editScheduledDeactivation}>
                        <Button
                            onClick={scheduleDeactivationFormVisibility.setTrue}
                            text={tr('Schedule deactivation')}
                            view="warning"
                            outline
                            size="s"
                        />
                    </Restricted>
                    <Restricted visible={!!sessionUser.role?.editUserRole}>
                        <UserRoleComboBox role={user.role} onChange={handleEditUserRole} />
                    </Restricted>
                </EditButtonsWrapper>
            </StyledHeader>

            <PageSep />

            <StyledUserInfoWrapper>
                <StyledLeftPanel>
                    <Restricted
                        visible={
                            sessionUser.role?.viewUserBonuses ||
                            sessionUser.role?.editUserBonuses ||
                            user.id === sessionUser.id
                        }
                    >
                        <UserBonusPoints user={user} />
                    </Restricted>

                    {nullable(user.achievements?.length || sessionUser.role?.editUserAchievements, () => (
                        <UserAchievementList user={user} isEditable={!!sessionUser.role?.editUserAchievements} />
                    ))}

                    <UserContacts user={user} />

                    {nullable(user.otherNames, (names) => (
                        <NarrowSection title={tr('Previous names')}>
                            {names.map(({ name }, i) => (
                                <Text color={gray10} key={`${i}-${name}`} size="s">
                                    {name}
                                </Text>
                            ))}
                        </NarrowSection>
                    ))}

                    <UserDevices user={user} />

                    <Restricted visible={user.meta.isActivityViewable}>
                        <Link href={pages.userActivity(user.id)}>{tr('History of activity')}</Link>
                    </Restricted>
                </StyledLeftPanel>

                <StyledRightPanel>
                    <UserSummary user={user} />

                    <UserMembershipsList user={user} />

                    {nullable(user.supervisorOf?.length, () => (
                        <NarrowSection title={tr('Supervisor of users')}>
                            {user.supervisorOf?.map((u) => (
                                <StyledUserListWrapper key={u.id}>
                                    <UserListItem user={u} />
                                </StyledUserListWrapper>
                            ))}
                        </NarrowSection>
                    ))}

                    {nullable(user.supervisorIn?.length, () => (
                        <NarrowSection title={tr('Supervisor in teams')}>
                            {user.supervisorIn?.map((group) => (
                                <GroupListItem groupId={group.id} groupName={group.name} key={group.id} />
                            ))}
                        </NarrowSection>
                    ))}
                </StyledRightPanel>
            </StyledUserInfoWrapper>
        </LayoutMain>
    );
};

interface UserPageProps {
    userId?: string;
    userLogin?: string;
}

export const UserPage = ({ userId = '', userLogin = '' }: UserPageProps) => {
    const userByLogin = trpc.user.getByLogin.useQuery(userLogin, {
        enabled: Boolean(userLogin),
    });
    const userById = trpc.user.getById.useQuery(userId, {
        enabled: Boolean(userId),
    });
    const user = userByLogin.data || userById.data;

    if (!user) return null;

    return <UserPageInner user={user} />;
};
