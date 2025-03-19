import { ComponentProps, FC } from 'react';

import { useRouter } from '../../hooks/useRouter';
import { LayoutMain } from '../LayoutMain/LayoutMain';
import { DecreeForm } from '../DecreeForm/DecreeForm';
import { useUserCreationRequestMutations } from '../../modules/userCreationRequestHooks';
import { CreateDecreeForm } from '../CreateDecreeForm/CreateDecreeForm';
import { UserCreationRequestType } from '../../modules/userCreationRequestTypes';

import s from './ToDecreeRequestPage.module.css';
import { tr } from './ToDecreeRequestPage.i18n';

interface ToDecreeRequestFormProps {
    user: ComponentProps<typeof CreateDecreeForm>['user'];
}

export const ToDecreeRequestPage: FC<ToDecreeRequestFormProps> = ({ user }) => {
    const router = useRouter();

    const { createDecreeRequest } = useUserCreationRequestMutations();

    const onSubmit: ComponentProps<typeof DecreeForm>['onSubmit'] = async (data) => {
        await createDecreeRequest(data);
        router.user(user.id);
    };

    return (
        <LayoutMain pageTitle={tr('Request')}>
            <div className={s.Wrapper}>
                <CreateDecreeForm user={user} type={UserCreationRequestType.toDecree} onSubmit={onSubmit} />
            </div>
        </LayoutMain>
    );
};
