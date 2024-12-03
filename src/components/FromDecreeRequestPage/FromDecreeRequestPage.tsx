import { ComponentProps, FC } from 'react';

import { useRouter } from '../../hooks/useRouter';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { DecreeForm } from '../DecreeForm/DecreeForm';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { CreateDecreeForm } from '../CreateDecreeForm/CreateDecreeForm';

import s from './FromDecreeRequestPage.module.css';
import { tr } from './FromDecreeRequestPage.i18n';

interface FromDecreeRequestFormProps {
    user: ComponentProps<typeof CreateDecreeForm>['user'];
}

export const FromDecreeRequestPage: FC<FromDecreeRequestFormProps> = ({ user }) => {
    const router = useRouter();

    const { createDecreeRequest } = useUserCreationRequestMutations();

    const onSubmit: ComponentProps<typeof DecreeForm>['onSubmit'] = async (data) => {
        await createDecreeRequest(data);
        router.user(user.id);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <CreateDecreeForm user={user} type="fromDecree" onSubmit={onSubmit} />
            </div>
        </LayoutMain>
    );
};
