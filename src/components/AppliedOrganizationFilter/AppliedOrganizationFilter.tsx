import { AppliedFilter, Badge, Input, Select, SelectPanel, SelectTrigger, TagCleanButton, Text } from "@taskany/bricks/harmony";
import { useState } from "react";
import { trpc } from "../../trpc/trpcClient";
import { nullable } from "@taskany/bricks";

interface AppliedOrganizationFilterProps {
    label: string;
    onCleanFilter: () => void;
    selectedOrganizations: string[] | undefined;
    onChange: (group: {id: string; name: string}[]) => void;
    onClose: () => void;
}

export const AppliedOrganizationFilter = ({ label, onCleanFilter, selectedOrganizations, onChange, onClose }: AppliedOrganizationFilterProps) => {
    const [organizationQuery, setOrganizationQuery] = useState('');

    const { data: organizations = [] } = trpc.organizationUnit.getList.useQuery(
        {
            search: organizationQuery,
            take: 10,
            include: selectedOrganizations
        },
        {
            keepPreviousData: true
        }
    );

    const organizationValue = organizations.filter((organization) => selectedOrganizations?.includes(organization.id));

    return (
        <AppliedFilter label={label} action={<TagCleanButton size="s" onClick={onCleanFilter} />}>
            <Select
                arrow
                value={organizationValue}
                items={organizations}
                onClose={onClose}
                onChange={onChange}
                selectable
                mode="multiple"
                renderItem={({ item }) => (
                    <Text key={item.id} size="s" ellipsis>{item.name}</Text>
                )}
            >
                <SelectTrigger>
                    {nullable(
                        selectedOrganizations && selectedOrganizations.length > 1,
                        () => organizationValue?.map((organization) => (
                            <Badge weight="regular" text={organization.name} />
                        )),
                        nullable(organizationValue[0], (organization) => <Badge weight="regular" text={organization.name} />)
                    )}
                </SelectTrigger>
                <SelectPanel placement="bottom">
                    <Input placeholder="" onChange={(e) => setOrganizationQuery(e.target.value)} />
                </SelectPanel>
            </Select>
        </AppliedFilter>
    );
};
