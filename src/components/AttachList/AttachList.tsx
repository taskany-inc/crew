import { IconBinOutline, IconFileOutline } from '@taskany/icons';
import { Attach } from 'prisma/prisma-client';
import { Button } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';
import { useState } from 'react';

import { Link } from '../Link';
import { WarningModal } from '../WarningModal/WarningModal';
import { useAttachMutations } from '../../modules/attachHooks';
import { useBoolean } from '../../hooks/useBoolean';
import { pages } from '../../hooks/useRouter';

import s from './AttachList.module.css';
import { tr } from './AttachList.i18n';

interface AttachListProps {
    attaches?: Attach[];
    onDelete?: (id: string) => void;
}

export const AttachList = ({ attaches, onDelete }: AttachListProps) => {
    const deleteAttachVisible = useBoolean(false);

    const { deleteAttach } = useAttachMutations();
    const [attach, setAttach] = useState<undefined | Attach>();

    const onDeleteClick = (currentAttach: Attach) => {
        setAttach(currentAttach);
        deleteAttachVisible.setTrue();
    };

    const confirmAttachDelete = () => {
        if (onDelete && attach) {
            onDelete(attach.id);
            deleteAttach(attach.id);
            deleteAttachVisible.setFalse();
        }
    };

    const cancelAttachDelete = () => {
        setAttach(undefined);
        deleteAttachVisible.setFalse();
    };

    return nullable(attaches, (attaches) => (
        <>
            {attaches.map((file) => (
                <div className={s.AttachItem} key={`attach-${file.id}`}>
                    <Link className={s.Link} href={pages.attach(file.id)} target="_blank">
                        <IconFileOutline size="s" /> {file.filename}{' '}
                    </Link>
                    {nullable(onDelete, () => (
                        <Button
                            type="button"
                            view="ghost"
                            size="s"
                            className={s.IconBin}
                            iconLeft={<IconBinOutline size="s" onClick={() => onDeleteClick(file)} />}
                        />
                    ))}
                </div>
            ))}
            <WarningModal
                view="warning"
                visible={deleteAttachVisible.value}
                onCancel={cancelAttachDelete}
                onConfirm={confirmAttachDelete}
                warningText={tr('attach deleting confirmation {filename}', { filename: attach?.filename || '' })}
            />
        </>
    ));
};
