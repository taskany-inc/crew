import {
    Button,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    Modal,
    ModalContent,
    ModalCross,
    ModalHeader,
} from '@taskany/bricks';
import { Vacancy } from 'prisma/prisma-client';

import { useVacancyMutations } from '../../modules/vacancyHooks';

import { tr } from './ArchiveVacancyModal.i18n';

type ArchiveVacancyModalProps = {
    visible: boolean;
    vacancy: Vacancy;
    onClose: VoidFunction;
};

export const ArchiveVacancyModal = ({ visible, vacancy, onClose }: ArchiveVacancyModalProps) => {
    const { archiveVacancy } = useVacancyMutations();

    const onArchiveClick = async () => {
        await archiveVacancy(vacancy.id);
        onClose();
    };

    return (
        <Modal visible={visible} onClose={onClose} width={500}>
            <ModalHeader>
                <FormTitle>{tr('Archive vacancy {vacancyName}', { vacancyName: vacancy.name })}</FormTitle>
                <ModalCross onClick={onClose} />
            </ModalHeader>

            <ModalContent>
                <Form>
                    <FormActions>
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onClose} />
                            <Button size="m" view="danger" onClick={onArchiveClick} text={tr('Archive')} />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </Modal>
    );
};
