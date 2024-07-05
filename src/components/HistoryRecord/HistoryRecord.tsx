import { ComponentProps, ReactNode, useCallback } from 'react';
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
                    </>
                ))}
            </>
        );
    },

    CreateUserCreationRequest: ({ event }) => {
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <div className={s.Row}>
                <>
                    {tr('create')} {tr('request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag>{' '}
                    {tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                </>
            </div>
        );
    },

    AcceptUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <div className={s.Row}>
                <>
                    {tr(event.after.status)} {tr('request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag>{' '}
                    {tr('to create user')}{' '}
                    {nullable(event.user, (user) => (
                        <UserListItem user={user} />
                    ))}
                    {nullable(event.after.comment, (comment) => (
                        <>
                            <div className={s.Row}>
                                {tr('show comment')}
                                <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                            </div>
                            {nullable(visible.value, () => (
                                <Text>{comment}</Text>
                            ))}
                        </>
                    ))}
                </>
            </div>
        );
    },

    DeclineUserCreationRequest: ({ event }) => {
        const visible = useBoolean(false);
        const [, copy] = useCopyToClipboard();

        const handleCopyId = useCallback(() => {
            notifyPromise(copy(event.after.id), 'copy');
        }, [copy, event.after.id]);

        return (
            <div className={s.Row}>
                <>
                    {tr(event.after.status)} {tr('request')} <Tag onClick={handleCopyId}>{event.after.id}</Tag>{' '}
                    {tr('to create user')}{' '}
                    <BoldText>
                        {event.after.name} ({event.after.email})
                    </BoldText>
                    {nullable(event.after.comment, (comment) => (
                        <>
                            <div className={s.Row}>
                                {tr('show comment')}
                                <ToggleShowMore visible={visible.value} setVisible={visible.toggle} />
                            </div>
                            {nullable(visible.value, () => (
                                <Text>{comment}</Text>
                            ))}
                        </>
                    ))}
                </>
            </div>
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
            <>
                {tr('edited user bonuses')} <UserListItem user={event.user} /> {tr('from')}{' '}
                <BoldText>{event.before.amount}</BoldText> {tr('to')} <BoldText>{event.after.amount}</BoldText>{' '}
                {nullable(event.after.description, (d) => (
                    <>
                        {tr('with description')} <BoldText>{d}</BoldText>{' '}
                    </>
                ))}
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
                            : tr('transfer to {newOrganization} of', { newOrganization: event.after.newOrganization! })}
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
                                  newOrganization: event.before.newOrganization!,
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
                    </>
                ))}
            </>
        );
    },
    CancelScheduledDeactivation: ({ event }) => {
        const visible = useBoolean(false);

        return (
            <>
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
            </>
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
