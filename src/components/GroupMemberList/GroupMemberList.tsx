import { Button, Tag, Text } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { IconCostEstimateOutline, IconStarOutline, IconUserOutline } from '@taskany/icons';

import { Leaf } from '../StructTreeView/StructTreeView';
import { TooltipIcon } from '../TooltipIcon';
import { usePreviewContext } from '../../contexts/previewContext';

import s from './GroupMemberList.module.css';
import { tr } from './GroupMemberList.i18n';

interface PersonProps {
    id: string;
    name: string | null;
    role: string | null;
    employment?: string | null;
}

export const Person: React.FC<PersonProps & { icon: React.ReactNode }> = ({ name, icon, employment, role, id }) => {
    const { showUserPreview } = usePreviewContext();
    return (
        <div className={s.GroupMember}>
            <span className={s.GroupMemberIcon}>{icon}</span>
            <Text size="m">{name}</Text>
            {nullable(role, (r) => (
                <Tag view="rounded" size="m" color="primary">
                    {r}
                </Tag>
            ))}
            {nullable(employment, (name) => (
                <Text size="s" color="var(--text-secondary)">
                    {name}
                </Text>
            ))}
            <Button
                view="clear"
                iconLeft={
                    <TooltipIcon text={tr('Details')} placement="top">
                        <IconCostEstimateOutline size="s" />
                    </TooltipIcon>
                }
                onClick={() => showUserPreview(id)}
            />
        </div>
    );
};

export const GroupMemberList: React.FC<{ members: Array<PersonProps & { isSupervisor: boolean }> }> = ({ members }) => (
    <>
        {members.map(({ isSupervisor, ...user }) => (
            <Leaf key={user.id}>
                <Person
                    icon={nullable(
                        isSupervisor,
                        () => (
                            <TooltipIcon text={tr('Manager')} placement="top">
                                <IconStarOutline size="s" />
                            </TooltipIcon>
                        ),
                        <IconUserOutline size="s" />,
                    )}
                    {...user}
                />
            </Leaf>
        ))}
    </>
);
