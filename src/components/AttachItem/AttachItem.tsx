import { Button, nullable } from '@taskany/bricks';
import { IconBinOutline } from '@taskany/icons';

import { Link } from '../Link';
import { File } from '../../modules/attachTypes';
import { useAttachMutations } from '../../modules/attachHooks';
import { pages } from '../../hooks/useRouter';
import { useBoolean } from '../../hooks/useBoolean';

import { tr } from './AttachItem.i18n';
import s from './AttachItem.module.css';

interface AttachItemProps {
    file: File;
    onRemove?: () => void;
}

export const AttachItem = ({ file, onRemove }: AttachItemProps) => {
    const showDeleteButton = useBoolean(false);

    const { deleteAttach } = useAttachMutations();

    const onDeleteAttachClick = () => {
        deleteAttach(file.id);
        onRemove && onRemove();
    };

    return (
        <div key={file.id} className={s.AttachItem}>
            <Link className={s.AttachName} href={pages.attach(file.id)} target="_blank">
                {file.name}
            </Link>
            {nullable(
                showDeleteButton.value,
                () => (
                    <>
                        <Button
                            brick="right"
                            size="s"
                            outline
                            view="danger"
                            text={tr('Delete')}
                            onClick={onDeleteAttachClick}
                        />
                        <Button brick="left" size="s" outline text={tr('Cancel')} onClick={showDeleteButton.setFalse} />
                    </>
                ),
                <IconBinOutline className={s.IconBin} size="s" onClick={showDeleteButton.setTrue} />,
            )}
        </div>
    );
};
