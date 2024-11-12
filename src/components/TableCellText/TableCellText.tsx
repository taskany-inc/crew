import { Tooltip, Text } from '@taskany/bricks/harmony';
import { useRef } from 'react';

import s from './TableCellText.module.css';

interface TableCellTextProps {
    text: string | React.ReactNode;
    twoLines?: boolean;
}

export const TableCellText = ({ text, twoLines }: TableCellTextProps) => {
    const ref = useRef(null);
    return (
        <>
            <Text ellipsis ref={ref} className={twoLines ? s.TableCellTextWithTwoLines : s.TableCellText}>
                {text}
            </Text>
            <Tooltip reference={ref}>{text}</Tooltip>
        </>
    );
};
