import { ComponentProps, FC } from 'react';

import { useRouter } from '../../hooks/useRouter';
import { trpc } from '../../trpc/trpcClient';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { DecreeForm } from '../DecreeForm/DecreeForm';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';

import s from './FromDecreeRequestPage.module.css';
import { tr } from './FromDecreeRequestPage.i18n';

interface FromDecreeRequestFormProps {
    user: ComponentProps<typeof DecreeForm>['user'];
}

const FromDecreeRequestForm: FC<FromDecreeRequestFormProps> = ({ user }) => {
    const router = useRouter();

    const { createDecreeRequest } = useUserCreationRequestMutations();

    const onSubmit: ComponentProps<typeof DecreeForm>['onSubmit'] = async (data) => {
        await createDecreeRequest(data);
        router.user(user.id);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <DecreeForm user={user} type="fromDecree" onSubmit={onSubmit} />
            </div>
        </LayoutMain>
    );
};

interface FromDecreeRequestPageProps {
    userId: string;
}

export const FromDecreeRequestPage: FC<FromDecreeRequestPageProps> = ({ userId }) => {
    const { data: user } = trpc.user.getById.useQuery(userId, {
        enabled: Boolean(userId),
    });

    if (!user) {
        return null;
    }

    return <FromDecreeRequestForm user={user} />;
};
