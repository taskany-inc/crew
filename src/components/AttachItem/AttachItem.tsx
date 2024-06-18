import { Button, nullable } from '@taskany/bricks';
import { IconBinOutline } from '@taskany/icons';

import { Link } from '../Link';
import { File } from '../../modules/attachTypes';
import { useAttachMutations } from '../../modules/attachHooks';
import { pages } from '../../hooks/useRouter';
import { useBoolean } from '../../hooks/useBoolean';
import { SessionUser } from '../../utils/auth';

import { tr } from './AttachItem.i18n';
import s from './AttachItem.module.css';

interface AttachItemProps {
    file: File;
    user: SessionUser;
}

export const AttachItem = ({ file, user }: AttachItemProps) => {
    const showDeleteButton = useBoolean(false);

    const { deleteAttach } = useAttachMutations();

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
                            onClick={() => deleteAttach(file.id, user)}
                        />
                        <Button brick="left" size="s" outline text={tr('Cancel')} onClick={showDeleteButton.setFalse} />
                    </>
                ),
                <IconBinOutline className={s.IconBin} size="s" onClick={showDeleteButton.setTrue} />,
            )}
        </div>
    );
};
