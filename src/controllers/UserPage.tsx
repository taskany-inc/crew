import { LayoutMain } from '../components/layout/LayoutMain';
import { UserProfile } from '../components/users/UserProfile';

export const UserPage = () => {
    return (
        <LayoutMain pageTitle="">
            <UserProfile />
        </LayoutMain>
    );
};
