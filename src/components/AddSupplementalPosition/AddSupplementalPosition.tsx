import { OrganizationUnit } from 'prisma/prisma-client';
import { nullable } from '@taskany/bricks';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { IconBinOutline, IconPlusCircleOutline } from '@taskany/icons';

import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { useBoolean } from '../../hooks/useBoolean';
import { FormControl } from '../FormControl/FormControl';

import s from './AddSupplementalPosition.module.css';
import { tr } from './AddSupplementalPosition.i18n';

interface AddSupplementalPositionProps {
    onClose?: () => void;
    onOrganizatioUnitChange: (id?: string) => void;
    organizationUnits?: OrganizationUnit[];
    organizationUnitId?: string;
    percentage?: number;
    setPercentage: (p?: number) => void;
    unitId?: string;
    setUnitId: (unitId?: string) => void;
    errors?: { percentage?: { message?: string }; organizationUnitId?: { message?: string } };
    readOnly?: boolean;
    visible?: boolean;
}

export const AddSupplementalPosition = ({
    onClose,
    onOrganizatioUnitChange,
    organizationUnitId,
    organizationUnits,
    percentage,
    setPercentage,
    unitId,
    setUnitId,
    errors,
    readOnly,
    visible = false,
}: AddSupplementalPositionProps) => {
    const formVisibility = useBoolean(visible);

    const onReset = () => {
        formVisibility.setFalse();
        onClose && onClose();
    };

    const onOpen = () => {
        formVisibility.setTrue();
        setPercentage(0.01);
    };

    return (
        <div className={s.Base}>
            {nullable(
                formVisibility.value,
                () => (
                    <div>
                        <div className={s.Header}>
                            <Text as="h3">{tr('Supplemental position')}</Text>

                            {nullable(!readOnly, () => (
                                <AddInlineTrigger
                                    text={tr('Remove supplemental position')}
                                    icon={<IconBinOutline size="s" />}
                                    onClick={onReset}
                                />
                            ))}
                        </div>
                        <div className={s.TwoInputsRow}>
                            <FormControl label={tr('Supplemental organization')} required>
                                <OrganizationUnitComboBox
                                    readOnly={readOnly}
                                    searchType="internal"
                                    onChange={(orgUnit) => orgUnit && onOrganizatioUnitChange(orgUnit.id)}
                                    organizationUnitId={organizationUnitId}
                                    items={organizationUnits}
                                    error={errors?.organizationUnitId}
                                />
                            </FormControl>
                            <FormControl label={tr('Percentage')} required error={errors?.percentage}>
                                <FormControlInput
                                    readOnly={readOnly}
                                    placeholder={tr('Write percentage from 0.01 to 1')}
                                    outline
                                    size="m"
                                    autoComplete="off"
                                    type="number"
                                    step={0.01}
                                    value={readOnly && !percentage ? tr('Not specified') : percentage}
                                    onChange={(e) => setPercentage(Number(e.currentTarget.value))}
                                />
                            </FormControl>
                            <FormControl label={tr('Unit ID')}>
                                <FormControlInput
                                    readOnly={readOnly}
                                    value={unitId}
                                    outline
                                    autoComplete="off"
                                    size="m"
                                    placeholder={tr('Write unit ID')}
                                    onChange={(e) => setUnitId(e.currentTarget.value)}
                                />
                            </FormControl>
                        </div>
                    </div>
                ),

                <div className={s.InlineTrigger}>
                    {nullable(!readOnly, () => (
                        <AddInlineTrigger
                            text={tr('Add supplemental position')}
                            icon={<IconPlusCircleOutline size="s" className={s.Icon} />}
                            onClick={onOpen}
                        />
                    ))}
                </div>,
            )}
        </div>
    );
};
