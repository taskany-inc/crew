import { ComponentProps, ReactNode, useCallback, useMemo } from 'react';
import { nullable, useCopyToClipboard } from '@taskany/bricks';
import { Button, HistoryRecord as HistoryRecordBricks, Text, Tag } from '@taskany/bricks/harmony';
import { IconDividerLineOutline } from '@taskany/icons';

import { HistoryAction, HistoryEventData } from '../../modules/historyEventTypes';
import { dateAgo, formatDate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { UserListItem } from '../UserListItem/UserListItem';
import { capitalize } from '../../utils/capitalize';
import { GroupListItem } from '../GroupListItem';
import { useBoolean } from '../../hooks/useBoolean';
import { notifyPromise } from '../../utils/notifications/notifyPromise';
import { trpc } from '../../trpc/trpcClient';
import { getFavicon } from '../../utils/getFavicon';

import s from './HistoryRecord.module.css';
import { tr } from './HistoryRecord.i18n';

const BoldText = (props: ComponentProps<typeof Text>) => <Text weight="bold" as="span" {...props} />;

const ToggleShowMore = ({ visible, setVisible }: { visible: boolean; setVisible: () => void }) => (
    <Button
        size="xs"
        view={visible ? 'checked' : 'default'}
        iconLeft={<IconDividerLineOutline size="xs" />}
        onClick={setVisible}
    />
);

const ChangeListItem = ({
    title,
    before,
    after,
}: {
    title: string;
    before?: string | number | boolean;
    after?: string | number | boolean;
}) => {
    if (after === undefined) return null;
    return (
        <div>
            {title}:{' '}
            {nullable(before !== undefined, () => (
                <>
                    <BoldText strike>{String(before)}</BoldText> {'→ '}
                </>
            ))}
            <BoldText>{String(after)}</BoldText>
        </div>
    );
};

const componentMap: {
    [A in Capitalize<HistoryAction>]: (props: { event: HistoryEventData<Uncapitalize<A>> }) => ReactNode;
} = {
    CreateUser: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created new user')} <UserListItem user={event.user} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Name')} after={event.after.name} />
                        <ChangeListItem title={tr('Email')} after={event.after.email} />
                        <ChangeListItem title={tr('Phone')} after={event.after.phone} />
                        <ChangeListItem title={tr('Login')} after={event.after.login} />
                        <ChangeListItem title={tr('Organization id')} after={event.after.organizationalUnitId} />
                        <ChangeListItem title={tr('Accounting id')} after={event.after.accountingId} />
                        <ChangeListItem title={tr('Supervisor id')} after={event.after.supervisorId} />
                        <div>
                            {tr('External account')}{' '}
                            <BoldText>{event.after.createExternalAccount ? tr('was') : tr('was not')}</BoldText>{' '}
                            {tr('created')}
                        </div>
                    </>
                ))}
            </>
        );
    },

    EditUser: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited user')} <UserListItem user={event.user} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Name')} before={event.before.name} after={event.after.name} />
                        <ChangeListItem title={tr('Email')} before={event.before.email} after={event.after.email} />
                        <ChangeListItem title={tr('Phone')} before={event.before.phone} after={event.after.phone} />
                        <ChangeListItem title={tr('Login')} before={event.before.login} after={event.after.login} />
                        <ChangeListItem
                            title={tr('Supervisor id')}
                            before={event.before.supervisorId}
                            after={event.after.supervisorId}
                        />
                        <ChangeListItem
                            title={tr('Organization id')}
                            before={event.before.organizationalUnitId}
                            after={event.after.organizationalUnitId}
                        />
                        {nullable(event.before.name !== event.after.name, () => (
                            <Text>
                                {tr('Previous name')}{' '}
                                <BoldText>
                                    {event.before.savePreviousName ? tr('was_neutr') : tr('was not_neutr')}
                                </BoldText>{' '}
                                {tr('saved')}
                            </Text>
                        ))}
                    </>
                ))}
            </>
        );
    },

    EditMembershipPercentage: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('edited membership percentage')} <UserListItem user={event.user} />
                {tr('in a team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                {tr('from')} {event.before} {tr('to')} {event.after}
            </div>
        );
    },

    CreateUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const services = useMemo(
            () => event.after.services?.map((service) => `${service.serviceName} ${service.serviceId}`).join(', '),
            [event.after.services],
        );

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <>
                <div className={s.Row}>
                    {tr('created request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag>{' '}
                    {event.after.type === 'externalFromMainOrgEmployee' ? tr('to grant access') : tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Type')} after={event.after.type} />
                        <ChangeListItem title={tr('Name')} after={event.after.name} />
                        <ChangeListItem title={tr('Email')} after={event.after.email} />
                        <ChangeListItem title={tr('Work email')} after={event.after.workEmail} />
                        <ChangeListItem title={tr('Corporate email')} after={event.after.corporateEmail} />
                        <ChangeListItem title={tr('Login')} after={event.after.login} />
                        <ChangeListItem title={tr('Team')} after={event.after.groupId} />
                        <ChangeListItem title={tr('Organization id')} after={event.after.organizationUnitId} />
                        <ChangeListItem title={tr('Unit id')} after={event.after.unitId} />
                        <ChangeListItem
                            title={tr('Supplemental positions')}
                            after={event.after.supplementalPositions
                                ?.map(
                                    ({ organizationUnitId, percentage, unitId }) =>
                                        `${organizationUnitId}: ${percentage}% ${unitId ? `, ${unitId}` : ''}`,
                                )
                                .join(', ')}
                        />
                        <ChangeListItem title={tr('Supervisor login')} after={event.after.supervisorLogin} />
                        <ChangeListItem title={tr('Supervisor id')} after={event.after.supervisorId} />
                        <ChangeListItem title={tr('Title')} after={event.after.title} />
                        <ChangeListItem title={tr('OS preference')} after={event.after.osPreference} />
                        <ChangeListItem title={tr('Services')} after={services} />
                        <ChangeListItem title={tr('Date')} after={event.after.date} />
                        <ChangeListItem
                            title={tr('External organization supervisor login')}
                            after={event.after.externalOrganizationSupervisorLogin}
                        />
                        <ChangeListItem
                            title={tr('Access to internal systems')}
                            after={event.after.accessToInternalSystems}
                        />
                        <ChangeListItem
                            title={tr('Create external account')}
                            after={event.after.createExternalAccount}
                        />
                        <ChangeListItem title={tr('Comment')} after={event.after.comment} />
                        <ChangeListItem title={tr('Creation cause')} after={event.after.creationCause} />
                        <ChangeListItem title={tr('Location')} after={event.after.location} />
                        <ChangeListItem title={tr('Work space application')} after={event.after.workSpace} />
                        <ChangeListItem title={tr('Equipment')} after={event.after.equipment} />
                        <ChangeListItem title={tr('Extra equipment')} after={event.after.extraEquipment} />
                        <ChangeListItem title={tr('Work mode')} after={event.after.workMode} />
                        <ChangeListItem title={tr('Work mode comment')} after={event.after.workModeComment} />
                        <ChangeListItem title={tr('Buddy login')} after={event.after.buddyLogin} />
                        <ChangeListItem title="Buddy id" after={event.after.buddyId} />
                        <ChangeListItem title={tr('Coordinator login')} after={event.after.coordinatorLogin} />
                        <ChangeListItem title={tr('Coordinator id')} after={event.after.coordinatorId} />
                        <ChangeListItem title={tr('Recruiter login')} after={event.after.recruiterLogin} />
                        <ChangeListItem title={tr('Recruiter id')} after={event.after.recruiterId} />
                        <ChangeListItem title={tr('Line manager logins')} after={event.after.lineManagerLogins} />
                        <ChangeListItem title={tr('Line manager ids')} after={event.after.lineManagerIds} />
                        <ChangeListItem title={tr('Personal email')} after={event.after.personalEmail} />
                        <ChangeListItem title={tr('Curator logins')} after={event.after.curatorLogins} />
                        <ChangeListItem title={tr('Curator ids')} after={event.after.curatorIds} />
                        <ChangeListItem title={tr('Access to services')} after={event.after.permissionServices} />
                        <ChangeListItem
                            title={tr('Reason for granting access')}
                            after={event.after.reasonToGrantPermissionToServices}
                        />
                    </>
                ))}
            </>
        );
    },

    CancelUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <>
                <div className={s.Row}>
                    {tr('canceled request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag> {tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                    {nullable(event.after.comment, () => (
                        <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                    ))}
                </div>
                {nullable(visible.value, () => (
                    <ChangeListItem title={tr('Comment')} after={event.after.comment} />
                ))}
            </>
        );
    },

    AcceptUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <>
                <div className={s.Row}>
                    {tr('approved request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag> {tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                    {nullable(event.after.comment, () => (
                        <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                    ))}
                </div>
                {nullable(visible.value, () => (
                    <ChangeListItem title={tr('Comment')} after={event.after.comment} />
                ))}
            </>
        );
    },

    DeclineUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <>
                <div className={s.Row}>
                    {tr('denied request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag> {tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                    {nullable(event.after.comment, () => (
                        <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                    ))}
                </div>
                {nullable(visible.value, () => (
                    <ChangeListItem title={tr('Comment')} after={event.after.comment} />
                ))}
            </>
        );
    },

    EditUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        const servicesAfter = useMemo(
            () => event.after.services?.map((service) => `${service.serviceName} ${service.serviceId}`).join(', '),
            [event.after.services],
        );

        const servicesBefore = useMemo(
            () => event.before.services?.map((service) => `${service.serviceName} ${service.serviceId}`).join(', '),
            [event.before.services],
        );

        return (
            <>
                <div className={s.Row}>
                    {tr('edited request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag> {tr('to create user')}{' '}
                    <BoldText>{event.after.name}</BoldText>
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Email')} after={event.after.email} before={event.before.email} />
                        <ChangeListItem title={tr('Date')} after={event.after.date} before={event.before.date} />
                        <ChangeListItem
                            title={tr('Work email')}
                            after={event.after.workEmail}
                            before={event.before.workEmail}
                        />
                        <ChangeListItem
                            title={tr('Corporate email')}
                            after={event.after.corporateEmail}
                            before={event.before.corporateEmail}
                        />
                        <ChangeListItem title={tr('Login')} after={event.after.login} before={event.before.login} />
                        <ChangeListItem title={tr('Team')} after={event.after.groupId} before={event.before.groupId} />
                        <ChangeListItem
                            title={tr('Organization id')}
                            after={event.after.organizationUnitId}
                            before={event.before.organizationUnitId}
                        />
                        <ChangeListItem title={tr('Unit id')} after={event.after.unitId} before={event.before.unitId} />
                        <ChangeListItem
                            title={tr('Supplemental positions')}
                            after={event.after.supplementalPositions
                                ?.map(
                                    ({ organizationUnitId, percentage, unitId }) =>
                                        `${organizationUnitId}: ${percentage}% ${unitId ? `, ${unitId}` : ''}`,
                                )
                                .join(', ')}
                            before={event.before.supplementalPositions
                                ?.map(
                                    ({ organizationUnitId, percentage, unitId }) =>
                                        `${organizationUnitId}: ${percentage}% ${unitId ? `, ${unitId}` : ''}`,
                                )
                                .join(', ')}
                        />
                        <ChangeListItem
                            title={tr('Supervisor login')}
                            after={event.after.supervisorLogin}
                            before={event.before.supervisorLogin}
                        />
                        <ChangeListItem
                            title={tr('Supervisor id')}
                            after={event.after.supervisorId}
                            before={event.before.supervisorId}
                        />
                        <ChangeListItem title={tr('Title')} after={event.after.title} before={event.before.title} />
                        <ChangeListItem
                            title={tr('OS preference')}
                            after={event.after.osPreference}
                            before={event.before.osPreference}
                        />
                        <ChangeListItem title={tr('Services')} after={servicesAfter} before={servicesBefore} />
                        <ChangeListItem title={tr('Date')} after={event.after.date} before={event.before.date} />
                        <ChangeListItem
                            title={tr('Access to internal systems')}
                            after={event.after.accessToInternalSystems}
                            before={event.before.accessToInternalSystems}
                        />
                        <ChangeListItem
                            title={tr('Comment')}
                            after={event.after.comment}
                            before={event.before.comment}
                        />
                        <ChangeListItem
                            title={tr('Creation cause')}
                            after={event.after.creationCause}
                            before={event.before.creationCause}
                        />
                        <ChangeListItem
                            title={tr('Location')}
                            after={event.after.location}
                            before={event.before.location}
                        />
                        <ChangeListItem
                            title={tr('Work space application')}
                            after={event.after.workSpace}
                            before={event.before.workSpace}
                        />
                        <ChangeListItem
                            title={tr('Equipment')}
                            after={event.after.equipment}
                            before={event.before.equipment}
                        />
                        <ChangeListItem
                            title={tr('Extra equipment')}
                            after={event.after.extraEquipment}
                            before={event.before.extraEquipment}
                        />
                        <ChangeListItem
                            title={tr('Work mode')}
                            after={event.after.workMode}
                            before={event.before.workMode}
                        />
                        <ChangeListItem
                            title={tr('Work mode comment')}
                            after={event.after.workModeComment}
                            before={event.before.workModeComment}
                        />
                        <ChangeListItem
                            title={tr('Buddy login')}
                            after={event.after.buddyLogin}
                            before={event.before.buddyLogin}
                        />
                        <ChangeListItem title="Buddy id" after={event.after.buddyId} before={event.before.buddyId} />
                        <ChangeListItem
                            title={tr('Coordinator login')}
                            after={event.after.coordinatorLogin}
                            before={event.before.coordinatorLogin}
                        />
                        <ChangeListItem
                            title={tr('Coordinator id')}
                            after={event.after.coordinatorId}
                            before={event.before.coordinatorId}
                        />
                        <ChangeListItem
                            title={tr('Recruiter login')}
                            after={event.after.recruiterLogin}
                            before={event.before.recruiterLogin}
                        />
                        <ChangeListItem
                            title={tr('Recruiter id')}
                            after={event.after.recruiterId}
                            before={event.before.recruiterId}
                        />
                        <ChangeListItem
                            title={tr('Line manager logins')}
                            after={event.after.lineManagerLogins}
                            before={event.before.lineManagerLogins}
                        />
                        <ChangeListItem
                            title={tr('Line manager ids')}
                            after={event.after.lineManagerIds}
                            before={event.before.lineManagerIds}
                        />
                        <ChangeListItem
                            title={tr('Personal email')}
                            after={event.after.personalEmail}
                            before={event.before.personalEmail}
                        />
                        <ChangeListItem
                            title={tr('Curator logins')}
                            after={event.after.curatorLogins}
                            before={event.before.curatorLogins}
                        />
                        <ChangeListItem
                            title={tr('Curator ids')}
                            after={event.after.curatorIds}
                            before={event.before.curatorIds}
                        />
                        <ChangeListItem
                            title={tr('Access to services')}
                            after={event.after.permissionServices}
                            before={event.before.permissionServices}
                        />
                        <ChangeListItem
                            title={tr('Reason for granting access')}
                            after={event.after.reasonToGrantPermissionToServices}
                            before={event.before.reasonToGrantPermissionToServices}
                        />
                        <ChangeListItem
                            title={tr('Attach filenames')}
                            after={event.after.attachFilenames}
                            before={event.before.attachFilenames}
                        />
                    </>
                ))}
            </>
        );
    },

    EditUserActiveState: ({ event }) => {
        const stateTr = (active: boolean) => (active ? tr('active') : tr('inactive'));
        return (
            <div className={s.Row}>
                {tr('edited user state')}
                <UserListItem user={event.user} /> {tr('from')} <BoldText>{stateTr(event.before)}</BoldText> {tr('to')}{' '}
                <BoldText>{stateTr(event.after)}</BoldText>
            </div>
        );
    },

    EditUserBonuses: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('edited user bonuses')} <UserListItem user={event.user} /> {tr('from')}{' '}
                <BoldText>{event.before.amount}</BoldText> {tr('to')} <BoldText>{event.after.amount}</BoldText>{' '}
                {nullable(event.after.description, (d) => (
                    <>
                        {tr('with description')} <BoldText>{d}</BoldText>{' '}
                    </>
                ))}
            </div>
        );
    },

    EditUserRole: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('edited role of user')} <UserListItem user={event.user} />
                {nullable(event.before.roleCode, (r) => (
                    <>
                        {tr('from')} <BoldText>{r}</BoldText>{' '}
                    </>
                ))}
                {tr('to')} <BoldText>{event.after.roleCode}</BoldText>
            </div>
        );
    },

    EditUserMailingSettings: ({ event }) => {
        return (
            <>
                <div className={s.Row}>
                    {tr('edited mailing settings of')} <UserListItem user={event.user} />
                </div>
                <ChangeListItem title={event.after.type} after={event.after.value} />
                <ChangeListItem title={tr('Organization id')} after={event.after.organizationUnitId} />
            </>
        );
    },

    EditAdditionalEmailMailingSettings: ({ event }) => {
        return (
            <>
                <div className={s.Row}>
                    {tr('edited additional emails for {orgId} in mailing type {type}', {
                        orgId: event.after.organizationUnitId || '',
                        type: event.after.type,
                    })}
                </div>
                <ChangeListItem
                    title={tr('Additional emails')}
                    after={event.after.additionalEmails}
                    before={event.before.additionalEmails}
                />
            </>
        );
    },

    AddUserToGroup: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added user')} <UserListItem user={event.user} /> {tr('to the team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />{' '}
                {nullable(event.after.percentage, (percentage) => (
                    <>{tr('with {percentage}% of membership', { percentage })}</>
                ))}
            </div>
        );
    },

    RemoveUserFromGroup: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed user')} <UserListItem user={event.user} /> {tr('from the team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    CreateGroup: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Name')} after={event.after.name} />
                        <ChangeListItem title={tr('Parent team id')} after={event.after.parentId} />
                        <ChangeListItem title={tr('Virtual team')} after={event.after.virtual} />
                        <ChangeListItem title={tr('Organizational team')} after={event.after.organizational} />
                        <ChangeListItem title={tr('Supervisor id')} after={event.after.supervisorId} />
                    </>
                ))}
            </>
        );
    },

    EditGroup: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Name')} before={event.before.name} after={event.after.name} />
                        <ChangeListItem
                            title={tr('Description')}
                            before={event.before.description}
                            after={event.after.description}
                        />
                        <ChangeListItem
                            title={tr('Organizational team')}
                            before={event.before.organizational}
                            after={event.after.organizational}
                        />
                        <ChangeListItem
                            title={tr('Supervisor id')}
                            before={event.before.supervisorId}
                            after={event.after.supervisorId}
                        />
                    </>
                ))}
            </>
        );
    },

    ArchiveGroup: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('archived team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    DeleteGroup: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('deleted team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    MoveGroup: ({ event }) => {
        return (
            <>
                <div className={s.Row}>
                    {tr('transferred team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                </div>
                <ChangeListItem title={tr('Parent team id')} before={event.before} after={event.after} />
            </>
        );
    },

    AddUserToGroupAdmin: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added admin')} <UserListItem user={event.user} /> {tr('to the team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    RemoveUserFromGroupAdmin: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed admin')} <UserListItem user={event.user} /> {tr('from the team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    AddRoleToMembership: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added role')} <BoldText>{event.after}</BoldText> {tr('for user')}{' '}
                <UserListItem user={event.user} /> {tr('in a team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    RemoveRoleFromMembership: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed role')} <BoldText>{event.after}</BoldText> {tr('from user')}{' '}
                <UserListItem user={event.user} /> {tr('in a team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    AddServiceToUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added service')} <BoldText>{event.after.name}</BoldText> {tr('with id')}{' '}
                <BoldText>{event.after.id}</BoldText> {tr('to a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    RemoveServiceFromUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed service')} <BoldText>{event.after.name}</BoldText> {tr('with id')}{' '}
                <BoldText>{event.after.id}</BoldText> {tr('from a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    CreateAchievement: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created achievement')} <BoldText>{event.after.title}</BoldText>
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Description')} after={event.after.description} />
                        <ChangeListItem title={tr('Hidden')} after={event.after.hidden} />
                    </>
                ))}
            </>
        );
    },

    GiveAchievementToUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('gave achievement')} <BoldText>{event.after.title}</BoldText>
                {nullable(event.after.amount, (a) => (
                    <>x{a}</>
                ))}{' '}
                {tr('to a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    AddDeviceToUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added device')} <BoldText>{event.after.name}</BoldText> {tr('with id')}{' '}
                <BoldText>{event.after.id}</BoldText> {tr('to a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    RemoveDeviceFromUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed device')} <BoldText>{event.after.name}</BoldText> {tr('with id')}{' '}
                <BoldText>{event.after.id}</BoldText> {tr('from a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    CreateVacancy: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                    <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Id')} after={event.after.id} />
                        <ChangeListItem title={tr('Status')} after={event.after.status} />
                        <ChangeListItem title={tr('Hire stream id')} after={event.after.hireStreamId} />
                        <ChangeListItem title={tr('Hiring manager id')} after={event.after.hiringManagerId} />
                        <ChangeListItem title={tr('HR id')} after={event.after.hrId} />
                        <ChangeListItem title={tr('Grade')} after={event.after.grade} />
                        <ChangeListItem title={tr('Unit')} after={event.after.unit} />
                    </>
                ))}
            </>
        );
    },

    EditVacancy: ({ event }) => {
        const visible = useBoolean(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                    <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Id')} after={event.after.id} />
                        <ChangeListItem title={tr('Name')} before={event.before.name} after={event.after.name} />
                        <ChangeListItem title={tr('Status')} before={event.before.status} after={event.after.status} />
                        <ChangeListItem
                            title={tr('Hiring manager id')}
                            before={event.before.hiringManagerId}
                            after={event.after.hiringManagerId}
                        />
                        <ChangeListItem title={tr('HR id')} before={event.before.hrId} after={event.after.hrId} />
                        <ChangeListItem title={tr('Grade')} before={event.before.grade} after={event.after.grade} />
                        <ChangeListItem title={tr('Unit')} before={event.before.unit} after={event.after.unit} />
                    </>
                ))}
            </>
        );
    },

    ArchiveVacancy: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('archived vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    UnarchiveVacancy: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('unarchived vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    DeleteVacancy: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('deleted vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                <GroupListItem groupId={event.group.id} groupName={event.group.name} />
            </div>
        );
    },

    CreateScheduledDeactivation: ({ event }) => {
        const visible = useBoolean(false);
        const locale = useLocale();

        return (
            <>
                <div className={s.Row}>
                    {tr('created scheduled')}
                    <BoldText>
                        {event.after.type === 'retirement'
                            ? tr('retirement of')
                            : tr('transfer to {newOrganization} of', {
                                  newOrganization: String(event.after.newOrganization),
                              })}
                    </BoldText>
                    <UserListItem user={event.user} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Id')} after={event.after.id} />
                        <ChangeListItem title={tr('Email')} after={event.after.email} />
                        <ChangeListItem title={tr('Phone')} after={event.after.phone} />
                        <ChangeListItem
                            title={tr('Deactivation date')}
                            after={
                                event.after.deactivateDate && formatDate(new Date(event.after.deactivateDate), locale)
                            }
                        />
                        <ChangeListItem title={tr('Organization')} after={event.after.organization} />
                        <ChangeListItem title={tr('New Organization')} after={event.after.newOrganization} />
                        <ChangeListItem title={tr('TeamLead')} after={event.after.teamLead} />
                        <ChangeListItem title={tr('New teamlead')} after={event.after.newTeamLead} />
                        <ChangeListItem title={tr('Organizational group')} after={event.after.organizationalGroup} />
                        <ChangeListItem
                            title={tr('New organizational group')}
                            after={event.after.newOrganizationalGroup}
                        />
                        <ChangeListItem title={tr('Organizational role')} after={event.after.organizationRole} />
                        <ChangeListItem title={tr('New organizational role')} after={event.after.newOrganizationRole} />
                        <ChangeListItem title={tr('Unit')} after={event.after.unitId} />
                        <ChangeListItem title={tr('Work mode')} after={event.after.workMode} />
                        <ChangeListItem title={tr('Work place')} after={event.after.workPlace} />
                        <ChangeListItem title={tr('Comment')} after={event.after.comments} />
                    </>
                ))}
            </>
        );
    },

    EditScheduledDeactivation: ({ event }) => {
        const visible = useBoolean(false);
        const locale = useLocale();

        return (
            <>
                <div className={s.Row}>
                    {tr('edited scheduled')}
                    <BoldText>
                        {event.before.type === 'retirement'
                            ? tr('retirement of')
                            : tr('transfer to {newOrganization} of', {
                                  newOrganization: String(event.before.newOrganization),
                              })}
                    </BoldText>
                    <UserListItem user={event.user} />
                    <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                </div>
                {nullable(visible.value, () => (
                    <>
                        <ChangeListItem title={tr('Id')} after={event.after.id} />
                        <ChangeListItem title={tr('Type')} after={event.after.type} before={event.before.type} />
                        <ChangeListItem title={tr('Email')} after={event.after.email} before={event.before.email} />
                        <ChangeListItem title={tr('Phone')} after={event.after.phone} before={event.before.phone} />
                        <ChangeListItem
                            title={tr('Deactivation date')}
                            after={
                                event.after.deactivateDate && formatDate(new Date(event.after.deactivateDate), locale)
                            }
                            before={
                                event.before.deactivateDate && formatDate(new Date(event.before.deactivateDate), locale)
                            }
                        />
                        <ChangeListItem
                            title={tr('Organization')}
                            after={event.after.organization}
                            before={event.before.organization}
                        />
                        <ChangeListItem
                            title={tr('New Organization')}
                            after={event.after.newOrganization}
                            before={event.before.newOrganization}
                        />
                        <ChangeListItem
                            title={tr('TeamLead')}
                            after={event.after.teamLead}
                            before={event.before.teamLead}
                        />
                        <ChangeListItem
                            title={tr('New teamlead')}
                            after={event.after.newTeamLead}
                            before={event.before.newTeamLead}
                        />
                        <ChangeListItem
                            title={tr('Organizational group')}
                            after={event.after.organizationalGroup}
                            before={event.before.organizationalGroup}
                        />
                        <ChangeListItem
                            title={tr('New organizational group')}
                            after={event.after.newOrganizationalGroup}
                            before={event.before.newOrganizationalGroup}
                        />
                        <ChangeListItem
                            title={tr('Organizational role')}
                            after={event.after.organizationRole}
                            before={event.before.organizationRole}
                        />
                        <ChangeListItem
                            title={tr('New organizational role')}
                            after={event.after.newOrganizationRole}
                            before={event.before.newOrganizationRole}
                        />
                        <ChangeListItem title={tr('Unit')} after={event.after.unitId} before={event.before.unitId} />
                        <ChangeListItem
                            title={tr('Work mode')}
                            after={event.after.workMode}
                            before={event.before.workMode}
                        />
                        <ChangeListItem
                            title={tr('Work place')}
                            after={event.after.workPlace}
                            before={event.before.workPlace}
                        />
                        <ChangeListItem
                            title={tr('Comment')}
                            after={event.after.comments}
                            before={event.before.comments}
                        />
                    </>
                ))}
            </>
        );
    },

    CancelScheduledDeactivation: ({ event }) => {
        const visible = useBoolean(false);

        return (
            <div className={s.Row}>
                {tr('canceled scheduled')}
                <BoldText>{event.after.type === 'retirement' ? tr('retirement of') : tr('transfer of')}</BoldText>
                <UserListItem user={event.user} />
                <Text>{tr('with comment: ')}</Text>
                <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                {nullable(visible.value, () => (
                    <Text>{event.after.comment}</Text>
                ))}
            </div>
        );
    },

    ChangeUserRoleScope: ({ event }) => {
        return (
            <div className={s.Row}>
                {event.after.value ? tr('added') : tr('removed')} {tr('scope')} <BoldText>{event.after.scope}</BoldText>{' '}
                {event.after.value ? tr('to the role') : tr('of the role')} <BoldText>{event.after.roleCode}</BoldText>
            </div>
        );
    },

    AddSupplementalPositionToUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('added supplemental position in')} <BoldText>{event.after.organizationUnitId}</BoldText> {tr('on')}{' '}
                <BoldText>{event.after.percentage}</BoldText>% {tr('to a user')} <UserListItem user={event.user} />
            </div>
        );
    },

    RemoveSupplementalPositionFromUser: ({ event }) => {
        return (
            <div className={s.Row}>
                {tr('removed supplemental position in')} <BoldText>{event.after.organizationUnitId}</BoldText>{' '}
                {tr('on')} <BoldText>{event.after.percentage}</BoldText>% {tr('from user')}{' '}
                <UserListItem user={event.user} />
            </div>
        );
    },
};

interface HistoryRecordProps {
    event: HistoryEventData;
}

const useAuthor = (event: HistoryEventData) => {
    const appConfig = trpc.appConfig.get.useQuery(undefined, {
        staleTime: Infinity,
    });
    if (event.actingUser) return { name: event.actingUser.name, email: event.actingUser.email };
    if (event.actingToken) {
        return { name: `${tr('API token')} ${event.actingToken.description}`, src: getFavicon(appConfig.data) };
    }
    if (event.actingSubsystem) {
        return { name: `${tr('Subsystem')} ${event.actingSubsystem}`, src: getFavicon(appConfig.data) };
    }
    return { name: tr('Unknown actor') };
};

export const HistoryRecord = ({ event }: HistoryRecordProps) => {
    const author = useAuthor(event);
    const locale = useLocale();
    const Component = componentMap[capitalize(event.action)] as (props: { event: HistoryEventData }) => ReactNode;

    return (
        <HistoryRecordBricks
            authors={[author]}
            date={dateAgo(event.createdAt, locale)}
            title={author.name || event.action}
        >
            <Text size="xs" weight="thin">
                <Component event={event} />
            </Text>
        </HistoryRecordBricks>
    );
};
