import { nullable } from '@taskany/bricks';
import { FormControlInput, Text } from '@taskany/bricks/harmony';
import { IconBinOutline, IconPlusCircleOutline } from '@taskany/icons';

import { OrganizationUnitComboBox } from '../OrganizationUnitComboBox/OrganizationUnitComboBox';
import { InlineTrigger } from '../InlineTrigger';
import { useBoolean } from '../../hooks/useBoolean';
import { FormControl } from '../FormControl/FormControl';

import s from './AddSupplementalPosition.module.css';
import { tr } from './AddSupplementalPosition.i18n';

interface AddSupplementalPositionProps {
    onClose?: () => void;
    onOrganizatioUnitChange: (id?: string) => void;
    organizationUnitId?: string;
    percentage?: number;
    setPercentage: (p?: number) => void;
    unitId?: string;
    setUnitId: (unitId?: string) => void;
    errors?: { percentage?: { message?: string }; organizationUnitId?: { message?: string } };
}

export const AddSupplementalPosition = ({
    onClose,
    onOrganizatioUnitChange,
    organizationUnitId,
    percentage,
    setPercentage,
    unitId,
    setUnitId,
    errors,
}: AddSupplementalPositionProps) => {
    const formVisibility = useBoolean(false);

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

                            <InlineTrigger
                                text={tr('Remove supplemental position')}
                                icon={<IconBinOutline size="s" />}
                                onClick={onReset}
                            />
                        </div>
                        <FormControl label={tr('Supplemental organization')} required>
                            <OrganizationUnitComboBox
                                className={s.Input}
                                onChange={(orgUnit) => orgUnit && onOrganizatioUnitChange(orgUnit.id)}
                                organizationUnitId={organizationUnitId}
                                error={errors?.organizationUnitId}
                            />
                        </FormControl>
                        <div className={s.TwoInputsRow}>
                            <FormControl label={tr('Unit ID')}>
                                <FormControlInput
                                    value={unitId}
                                    outline
                                    placeholder={tr('Write unit ID')}
                                    onChange={(e) => setUnitId(e.currentTarget.value)}
                                />
                            </FormControl>
                            <FormControl label={tr('Percentage')} required error={errors?.percentage}>
                                <FormControlInput
                                    placeholder={tr('Write percentage from 0.01 to 1')}
                                    outline
                                    type="number"
                                    step={0.01}
                                    value={percentage}
                                    onChange={(e) => setPercentage(Number(e.currentTarget.value))}
                                />
                            </FormControl>
                        </div>
                    </div>
                ),
                <InlineTrigger
                    text={tr('Add supplemental position')}
                    icon={<IconPlusCircleOutline size="s" />}
                    onClick={onOpen}
                />,
            )}
        </div>
    );
};
