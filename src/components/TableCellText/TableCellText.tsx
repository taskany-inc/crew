import { useCopyToClipboard } from '@taskany/bricks';
import { Tooltip, Text } from '@taskany/bricks/harmony';
import { useRef } from 'react';

import { notifyPromise } from '../../utils/notifications/notifyPromise';

import s from './TableCellText.module.css';

interface TableCellTextProps {
    text: string;
}

export const TableCellText = ({ text }: TableCellTextProps) => {
    const ref = useRef(null);
    const [, copyValue] = useCopyToClipboard();
    return (
        <>
            <Text ref={ref} className={s.TableCellText} onClick={() => notifyPromise(copyValue(text), 'copy')}>
                {text}
            </Text>
            <Tooltip reference={ref}>{text}</Tooltip>
        </>
    );
};
