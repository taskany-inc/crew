import cn from 'classnames';
import { Dot } from '@taskany/bricks/harmony';

import s from './StatusDot.module.css';

export const StatusDot = ({ status }: { status: string | null }) => {
    return (
        <Dot
            className={cn(
                s.StatusDot,
                { [s.StatusDotApproved]: status === 'Approved' },
                { [s.StatusDotDenied]: status === 'Denied' },
                { [s.StatusDotCanceled]: status === 'Canceled' },
                { [s.StatusDotDraft]: status === 'Draft' },
            )}
        />
    );
};
