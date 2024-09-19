import { Button, Input, nullable } from '@taskany/bricks';
import { IconPlusCircleSolid } from '@taskany/icons';
import { useState } from 'react';
import { OrganizationUnit } from 'prisma/prisma-client';

import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { InlineTrigger } from '../InlineTrigger';
import { useBoolean } from '../../hooks/useBoolean';
import { AddSupplementalPositionType } from '../../modules/organizationUnitSchemas';

import s from './AddSupplementalPosition.module.css';
import { tr } from './AddSupplementalPosition.i18n';

interface AddSupplementalPositionProps {
    onSubmit: (agrs: AddSupplementalPositionType) => void;
}

export const AddSupplementalPosition = ({ onSubmit }: AddSupplementalPositionProps) => {
    const [percentage, setPercentage] = useState<number | null>();
    const [unitId, setUnitId] = useState<string | null>();
    const [organizationUnit, setOrganizationUnit] = useState<null | OrganizationUnit>();
    const formVisibility = useBoolean(false);

    const onReset = () => {
        setPercentage(null);
        setOrganizationUnit(null);
        setUnitId(null);
        formVisibility.setFalse();
    };

    const inLineFormSubmit = async () => {
        organizationUnit && percentage && onSubmit({ organizationUnit, percentage, unitId });
        onReset();
    };

    return (
        <div className={s.Base}>
            {nullable(
                formVisibility.value,
                () => (
                    <div className={s.InputWrapper}>
                        <div className={s.Input}>
                            <OrganizationUnitComboBox onChange={(orgUnit) => orgUnit && setOrganizationUnit(orgUnit)} />
                        </div>
                        <Input
                            className={s.Input}
                            brick="center"
                            placeholder={tr('Unit id')}
                            onChange={(e) => setUnitId(e.target.value)}
                        />
                        <Input
                            className={s.PercentageInput}
                            brick="center"
                            type="number"
                            placeholder={tr('Percentage')}
                            onChange={(e) => setPercentage(Number(e.target.value))}
                        />
                        <Button
                            brick="center"
                            view="default"
                            text={tr('Cancel')}
                            type="button"
                            onClick={onReset}
                            outline
                        />
                        <Button
                            brick="left"
                            view="primary"
                            text={tr('Add')}
                            type="button"
                            outline
                            onClick={inLineFormSubmit}
                        />
                    </div>
                ),
                <InlineTrigger
                    text={tr('Add supplemental position')}
                    icon={<IconPlusCircleSolid size="s" />}
                    onClick={formVisibility.setTrue}
                />,
            )}
        </div>
    );
};
