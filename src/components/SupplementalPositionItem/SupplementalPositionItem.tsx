import { IconXSmallOutline } from '@taskany/icons';
import { Badge } from '@taskany/bricks/harmony';

import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { AddSupplementalPositionType } from '../../modules/organizationUnitSchemas';

import s from './SupplementalPositionItem.module.css';

interface SupplementalPositionItemProps {
    supplementalPosition: AddSupplementalPositionType;
    removeSupplementalPosition: (id: string) => void;
}

export const SupplementalPositionItem = ({
    supplementalPosition,
    removeSupplementalPosition,
}: SupplementalPositionItemProps) => (
    <Badge
        className={s.Badge}
        text={`${getOrgUnitTitle(supplementalPosition.organizationUnit)} ${supplementalPosition.percentage}%`}
        weight="thinner"
        size="s"
        view="outline"
        iconRight={
            <IconXSmallOutline
                size="xs"
                className={s.Icon}
                onClick={() => removeSupplementalPosition(supplementalPosition.organizationUnit.id)}
            />
        }
    />
);
