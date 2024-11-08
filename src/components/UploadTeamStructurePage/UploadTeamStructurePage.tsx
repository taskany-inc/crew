import { ComponentProps, useState } from 'react';
import { nullable } from '@taskany/bricks';
import {
    Alert,
    Badge,
    Button,
    FormControlFileUpload,
    Spinner,
    Text,
    TreeView,
    TreeViewNode,
    TreeViewTitle,
} from '@taskany/bricks/harmony';
import { IconUserCircleOutline } from '@taskany/icons';
import cn from 'classnames';
import { Group } from 'prisma/prisma-client';

import { CommonHeader } from '../CommonHeader';
import { FormControl } from '../FormControl/FormControl';
import { LayoutMain, PageContent } from '../LayoutMain/LayoutMain';
import { Person, StructureNode, structureNodeSchema } from '../../modules/importSchemas';
import { stringifyZodError } from '../../utils/stringifyZodError';
import { safelyParseJson } from '../../utils/safelyParseJson';
import { Link } from '../Link';
import { pages } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { usePreviewContext } from '../../contexts/previewContext';
import { GroupComboBox } from '../GroupComboBox/GroupComboBox';
import { Nullish } from '../../utils/types';

import s from './UploadTeamStructurePage.module.css';
import { tr } from './UploadTeamStructurePage.i18n';

const StructureFileUpload = ({ setStructure }: { setStructure: (s: StructureNode) => void }) => {
    const [error, setError] = useState<string>();

    const onDrop: ComponentProps<typeof FormControlFileUpload>['onDrop'] = async (files) => {
        const file = files[0];
        if (!file) return;
        const text = await file.text();
        const json = safelyParseJson(text);
        if (!json) {
            setError(tr('Cannot parse JSON'));
            return;
        }
        const validated = structureNodeSchema.safeParse(json);
        if (validated.success) {
            setStructure(validated.data);
        } else {
            setError(stringifyZodError(validated.error.flatten()));
        }
    };

    return (
        <>
            <FormControl label={tr('Team structure file')} className={s.UploadTeamStructurePageField}>
                <FormControlFileUpload
                    accept={{
                        'application/json': ['.json'],
                    }}
                    translates={{
                        idle: tr('Choose file'),
                        active: tr('Drop file here'),
                        loading: tr('Loading...'),
                        accepted: tr('Loaded'),
                        error: tr('Upload error'),
                        fileExtensionsText: tr('.json format'),
                    }}
                    maxFiles={1}
                    onDrop={onDrop}
                />
            </FormControl>

            {nullable(error, (e) => (
                <Alert view="warning" text={e} />
            ))}
        </>
    );
};

const UserList = ({ title, users }: { title: string; users: Person[] }) => {
    const { showUserPreview } = usePreviewContext();

    return nullable(users, (u) => (
        <div>
            <Text size="s">
                {title}:{' '}
                {u.map(({ id, name, role }) => (
                    <span key={id} className={s.UploadTeamStructurePageUser}>
                        <Link href={pages.user(id)} onClick={() => showUserPreview(id)}>
                            <Badge text={name || id} iconLeft={<IconUserCircleOutline size="xs" />} />
                        </Link>
                        {nullable(role, (r) => (
                            <Text as="span">({r})</Text>
                        ))}
                    </span>
                ))}
            </Text>
        </div>
    ));
};

const Row = ({
    name,
    people,
    teamLead,
    className,
}: {
    name: string;
    people: Person[];
    teamLead?: Person;
    className?: string;
}) => {
    return (
        <div className={cn(s.UploadTeamStructurePageRow, className)}>
            <Text weight="bold" size="ml">
                {name}
            </Text>
            {nullable(teamLead, (t) => (
                <UserList title={tr('Team lead')} users={[t]} />
            ))}
            <UserList title={tr('Users')} users={people} />
        </div>
    );
};

const StructureTree = ({ name, structure }: { name: string; structure: StructureNode }) => {
    return nullable(
        Object.keys(structure.nodes),
        (names) => (
            <TreeViewNode
                visible
                title={
                    <TreeViewTitle>
                        <Row name={name} people={structure.people} teamLead={structure.teamLead} />
                    </TreeViewTitle>
                }
            >
                {names.map((name) => (
                    <StructureTree key={name} name={name} structure={structure.nodes[name]} />
                ))}
            </TreeViewNode>
        ),
        <Row
            name={name}
            people={structure.people}
            teamLead={structure.teamLead}
            className={s.UploadTeamStructurePageRowNoChildren}
        />,
    );
};

export const UploadTeamStructurePage = () => {
    const [structure, setStructure] = useState<StructureNode>();
    const [rootGroup, setRootGroup] = useState<Nullish<Group>>();

    const uploadStructure = trpc.import.uploadStructure.useMutation();

    const onUpload = () => {
        if (!structure || !rootGroup) return;
        uploadStructure.mutateAsync({ structure, rootGroupId: rootGroup.id });
    };

    return (
        <LayoutMain pageTitle={tr('Upload team structure')}>
            <CommonHeader title={tr('Upload team structure')} />
            <PageContent>
                <FormControl label={tr('Root group for structure')} className={s.UploadTeamStructurePageField}>
                    <GroupComboBox defaultGroupId={rootGroup?.id} onChange={(group) => setRootGroup(group)} />
                </FormControl>

                {nullable(
                    structure,
                    (st) => (
                        <TreeView>
                            <StructureTree name={rootGroup?.name || 'root'} structure={st} />
                        </TreeView>
                    ),
                    <StructureFileUpload setStructure={setStructure} />,
                )}

                <div className={s.UploadTeamStructurePageAction}>
                    {nullable(
                        uploadStructure.error,
                        (e) => (
                            <Alert view="warning" text={e.message} />
                        ),
                        nullable(
                            uploadStructure.isSuccess,
                            () => <Alert view="default" text={tr('Upload result will be sent to your email')} />,
                            <Button
                                text={tr('Upload')}
                                view="primary"
                                onClick={onUpload}
                                disabled={uploadStructure.isLoading || !rootGroup || !structure}
                                iconRight={uploadStructure.isLoading ? <Spinner size="xs" /> : undefined}
                            />,
                        ),
                    )}
                </div>
            </PageContent>
        </LayoutMain>
    );
};
