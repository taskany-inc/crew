import { ComponentProps, useMemo, FC } from 'react';

import { DecreeForm } from '../DecreeForm/DecreeForm';
import { UserDecreeSchema } from '../../modules/userCreationRequestSchemas';
import { useRouter } from '../../hooks/useRouter';
import { SupplementalPositionWithUnit, UserDecreeRequest } from '../../modules/userCreationRequestTypes';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { getLastSupplementalPositions } from '../../utils/supplementalPositions';
import { trpc } from '../../trpc/trpcClient';

import { tr } from './DecreePage.i18n';
import s from './DecreePage.module.css';

interface DecreePageProps {
    request: UserDecreeRequest;
    mode: 'read' | 'edit';
}

export const DecreePage: FC<DecreePageProps> = ({ request, mode }) => {
    const router = useRouter();
    const { data: user } = trpc.user.getById.useQuery(request.userTargetId);

    const positions = useMemo(() => {
        if (!user) {
            return [];
        }
        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return positions;
    }, [user]);

    const defaultValues = useMemo(() => {
        const { mainPosition, supplementalPositions, firedOrganizationUnitId } = request.supplementalPositions.reduce<{
            supplementalPositions: SupplementalPositionWithUnit[];
            mainPosition: SupplementalPositionWithUnit | undefined;
            firedOrganizationUnitId: string | undefined;
        }>(
            (acum, item) => {
                if (item.status === 'FIRED') {
                    acum.firedOrganizationUnitId = item.organizationUnitId;
                } else if (item.main) {
                    acum.mainPosition = item;
                } else {
                    acum.supplementalPositions.push(item);
                }
                return acum;
            },
            { supplementalPositions: [], firedOrganizationUnitId: undefined, mainPosition: undefined },
        );

        const { type } = request;

        const initial: ComponentProps<typeof DecreeForm>['defaultValues'] = {
            id: request.id,
            type,
            userTargetId: request.userTargetId,
            percentage: mainPosition?.percentage ?? 1,
            unitId: mainPosition?.unitId ?? undefined,
            organizationUnitId: mainPosition?.organizationUnitId ?? undefined,
            surname: request.surname ?? undefined,
            firstName: request.firstName ?? undefined,
            middleName: request.middleName ?? undefined,
            login: request.login ?? undefined,
            comment: request.comment ?? undefined,
            workSpace: request.workSpace ?? undefined,
            phone: request.phone ?? undefined,
            email: request.email ?? undefined,
            workEmail: request.workEmail ?? undefined,
            personalEmail: request.personalEmail ?? undefined,
            corporateEmail: request.corporateEmail ?? undefined,
            workModeComment: request.workModeComment ?? undefined,
            equipment: request.equipment ?? undefined,
            extraEquipment: request.extraEquipment ?? undefined,
            location: request.location ?? undefined,
            title: request.title ?? undefined,
            supervisorId: request.supervisorId ?? undefined,
            buddyId: request.buddyId ?? undefined,
            workMode: request.workMode ?? undefined,
            lineManagerIds: request.lineManagerIds ?? undefined,
            coordinatorIds: request.coordinatorIds ?? undefined,
            date: request.date ?? undefined,
            groupId: request.groupId ?? undefined,
            firedOrganizationUnitId,
            supplementalPositions:
                supplementalPositions.map(({ unitId, ...rest }) => ({
                    ...rest,
                    unitId: unitId ?? undefined,
                })) ?? [],
        };

        if (initial.type === 'toDecree') {
            initial.disableAccount = request.disableAccount ?? undefined;
        }

        return initial;
    }, [request]);

    const { editDecreeRequest } = useUserCreationRequestMutations();

    const onSubmit = async (data: UserDecreeSchema) => {
        await editDecreeRequest({
            id: request.id,
            ...data,
        });

        router.user(request.userTargetId);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <DecreeForm
                    onCancel={() => router.user(request.userTargetId)}
                    type={request.type}
                    onSubmit={onSubmit}
                    defaultValues={defaultValues}
                    mode={mode}
                    supplementalPositions={request.type === 'toDecree' ? positions : undefined}
                />
            </div>
        </LayoutMain>
    );
};
