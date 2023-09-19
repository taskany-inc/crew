import { Text } from '@taskany/bricks';
import { gray9 } from '@taskany/colors';
import { IconPlusCircleOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';

export const UserDevices = () => {
    return (
        <div>
            <Text size="m" color={gray9} weight="bold">
                Corporate devices
                <PageSep width={300} margins={5} />
            </Text>

            {/* TODO: implement AddDeviceToUser */}
            <InlineTrigger icon={<IconPlusCircleOutline noWrap size="s" />} text={'Request a device'} disabled />
        </div>
    );
};
