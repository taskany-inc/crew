import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from '../InlineTrigger';
import { NarrowSection } from '../NarrowSection';

import { tr } from './users.i18n';

export const UserDevices = () => {
    return (
        <NarrowSection title={tr('Corporate devices')}>
            {/* TODO: implement AddDeviceToUser */}
            <InlineTrigger icon={<IconPlusCircleOutline noWrap size="s" />} text={'Request a device'} disabled />
        </NarrowSection>
    );
};
