import { ComponentProps, FC } from 'react';

import { useRouter } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { DecreeForm } from '../DecreeForm/DecreeForm';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import s from './ToDecreeRequestPage.module.css';
import { tr } from './ToDecreeRequestPage.i18n';

interface ToDecreeRequestFormProps {
    user: ComponentProps<typeof DecreeForm>['user'];
}

const ToDecreeRequestForm: FC<ToDecreeRequestFormProps> = ({ user }) => {
    const router = useRouter();

    const { createDecreeRequest } = useUserCreationRequestMutations();

    const onSubmit: ComponentProps<typeof DecreeForm>['onSubmit'] = async (data) => {
        await createDecreeRequest(data);
        router.user(user.id);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <DecreeForm user={user} type="toDecree" onSubmit={onSubmit} />
            </div>
        </LayoutMain>
    );
};

interface ToDecreeRequestPageProps {
    userId: string;
}

export const ToDecreeRequestPage: FC<ToDecreeRequestPageProps> = ({ userId }) => {
    const { data: user } = trpc.user.getById.useQuery(userId, {
        enabled: Boolean(userId),
    });

    if (!user) {
        return null;
    }

    return <ToDecreeRequestForm user={user} />;
};
