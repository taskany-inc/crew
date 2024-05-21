import { ComponentProps, Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { nullable } from '@taskany/bricks';
import { Button, HistoryRecord as HistoryRecordBricks, Text } from '@taskany/bricks/harmony';
import { IconDividerLineOutline } from '@taskany/icons';

import { HistoryAction, HistoryEventData } from '../../modules/historyEventTypes';
import { dateAgo } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { UserListItem } from '../UserListItem/UserListItem';
import { capitalize } from '../../utils/capitalize';
import { GroupListItem } from '../GroupListItem';

import s from './HistoryRecord.module.css';
import { tr } from './HistoryRecord.i18n';

const BoldText = (props: ComponentProps<typeof Text>) => <Text weight="bold" as="span" {...props} />;

const ToggleShowMore = ({ setVisible }: { setVisible: Dispatch<SetStateAction<boolean>> }) => (
    <Button size="xs" iconLeft={<IconDividerLineOutline size="xs" />} onClick={() => setVisible((v) => !v)} />
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created new user')} <UserListItem user={event.user} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited user')} <UserListItem user={event.user} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
                    <>
                        <ChangeListItem title={tr('Name')} before={event.before.name} after={event.after.name} />
                        <ChangeListItem title={tr('Email')} before={event.before.email} after={event.after.email} />
                        <ChangeListItem title={tr('Phone')} before={event.before.phone} after={event.after.phone} />
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
                {tr('edited user bonuses')} {tr('from')} <BoldText>{event.before.amount}</BoldText> {tr('to')}{' '}
                <BoldText>{event.after.amount}</BoldText>{' '}
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
                    <>
                        <ChangeListItem title={tr('Name')} after={event.after.name} />
                        <ChangeListItem title={tr('Parent team id')} after={event.after.parentId} />
                        <ChangeListItem title={tr('Virtual team')} after={event.after.virtual} />
                        <ChangeListItem title={tr('Organizational team')} after={event.after.organizational} />
                    </>
                ))}
            </>
        );
    },

    EditGroup: ({ event }) => {
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited team')} <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created achievement')} <BoldText>{event.after.title}</BoldText>
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('created vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                    <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
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
        const [visible, setVisible] = useState(false);
        return (
            <>
                <div className={s.Row}>
                    {tr('edited vacancy')} <BoldText>{event.after.name}</BoldText> {tr('in a team')}{' '}
                    <GroupListItem groupId={event.group.id} groupName={event.group.name} />
                    <ToggleShowMore setVisible={setVisible} />
                </div>
                {nullable(visible, () => (
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
};

interface HistoryRecordProps {
    event: HistoryEventData;
}

export const HistoryRecord = ({ event }: HistoryRecordProps) => {
    const author = { name: event.actingUser?.name, email: event.actingUser?.email || event.actingToken?.description };
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
