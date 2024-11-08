import { ComponentProps, useEffect, useRef, useState } from 'react';
import { formFieldName, nullable } from '@taskany/bricks';
import {
    Alert,
    Badge,
    Button,
    FormControlFileUpload,
    Select,
    SelectPanel,
    SelectTrigger,
    Spinner,
    Text,
} from '@taskany/bricks/harmony';
import readXlsxFile, { readSheetNames } from 'read-excel-file';

import { CommonHeader } from '../CommonHeader';
import { LayoutMain, PageContent } from '../LayoutMain/LayoutMain';
import { FormControl } from '../FormControl/FormControl';
import { StructureParsingConfig } from '../../modules/importSchemas';
import { pages } from '../../hooks/useRouter';

import s from './ParseTeamStructurePage.module.css';
import { tr } from './ParseTeamStructurePage.i18n';

const ExcelFileUpload = ({ setData }: { setData: (file: File, sheets: string[]) => void }) => {
    const onDrop: ComponentProps<typeof FormControlFileUpload>['onDrop'] = async (files) => {
        const file = files[0];
        if (!file) return;
        const sheets = await readSheetNames(file);
        setData(file, sheets);
    };

    return (
        <FormControl label={tr('Choose file with team structure')} className={s.ParseTeamStructurePageField}>
            <FormControlFileUpload
                accept={{
                    'application/vnd.ms-excel': ['.xls'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                }}
                translates={{
                    idle: tr('Choose file'),
                    active: tr('Drop file here'),
                    loading: tr('Loading...'),
                    accepted: tr('Loaded'),
                    error: tr('Upload error'),
                    fileExtensionsText: tr('.xls or .xlsx format'),
                }}
                maxFiles={1}
                onDrop={onDrop}
            />
        </FormControl>
    );
};

const SheetSelect = ({
    sheet,
    sheets,
    onSelect,
}: {
    sheet?: string;
    sheets?: string[];
    onSelect: (sheet?: string) => void;
}) => {
    return (
        <FormControl label={tr('Sheet')} required className={s.ParseTeamStructurePageField}>
            <Select
                arrow
                value={sheet ? [{ id: sheet }] : undefined}
                items={sheets?.map((s) => ({ id: s }))}
                onChange={(items) => onSelect(items[0]?.id)}
                selectable
                mode="single"
                renderItem={(props) => (
                    <Text key={props.item.id} size="s" ellipsis>
                        {props.item.id}
                    </Text>
                )}
            >
                <SelectTrigger size="m" placeholder={tr('Choose sheet')} view="outline">
                    {nullable(sheet, (s) => (
                        <Text>{s}</Text>
                    ))}
                </SelectTrigger>
                <SelectPanel placement="bottom-start" className={s.ParseTeamStructurePageDropdown} />
            </Select>
        </FormControl>
    );
};

const ColumnSelect = ({
    label,
    columns,
    onSelect,
    patterns = [],
    antiPatterns = [],
    required,
}: {
    label: string;
    columns: string[];
    onSelect: (column: number) => void;
    patterns?: string[];
    antiPatterns?: string[];
    required?: boolean;
}) => {
    const [column, setColumn] = useState<{ id: number; name: string }>();
    const firstRender = useRef(true);

    useEffect(() => {
        if (!firstRender.current) return;
        firstRender.current = false;
        const filtered = columns
            .map<{ name: string; id: number }>((name, id) => ({ name, id }))
            .filter(({ name }) => patterns.every((p) => name.toLowerCase().includes(p.toLowerCase())))
            .filter(({ name }) => !antiPatterns.some((p) => name.toLowerCase().includes(p.toLowerCase())));
        setColumn(filtered[0]);
    }, [columns, patterns, antiPatterns]);

    return (
        <FormControl label={label} required={required} className={s.ParseTeamStructurePageField}>
            <Select
                arrow
                value={column && [column]}
                items={columns.map((c, i) => ({ id: i, name: c }))}
                onChange={(items) => {
                    const item = items[0];
                    if (!item) return;
                    setColumn(item);
                    onSelect(item.id);
                }}
                selectable
                mode="single"
                renderItem={(props) => (
                    <Text key={`${props.item.id}-${props.item.name}`} size="s" ellipsis>
                        {props.item.name}
                    </Text>
                )}
            >
                <SelectTrigger size="m" placeholder={tr('Choose column')} view="outline">
                    {nullable(column, (c) => (
                        <Text>{c.name}</Text>
                    ))}
                </SelectTrigger>
                <SelectPanel placement="bottom-start" className={s.ParseTeamStructurePageDropdown} />
            </Select>
        </FormControl>
    );
};

const Configurator = ({ columns, file, sheet }: { columns: string[]; file: File; sheet?: string }) => {
    const [groupCount, setGroupCount] = useState(1);
    const [config, setConfig] = useState<Omit<StructureParsingConfig, 'sheet'>>({ fullName: 0, groups: [{ name: 0 }] });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string>();

    const upload = async () => {
        if (!sheet) return;
        setLoading(true);
        const body = new FormData();
        body.append(formFieldName, file);
        body.append('config', JSON.stringify({ ...config, sheet }));
        await fetch(pages.attachParseStructure, { method: 'POST', body })
            .then((res) => {
                res.ok ? setSuccess(true) : setError(`${res.status} ${res.statusText}`);
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className={s.ParseTeamStructurePageConfigurator}>
            <ColumnSelect
                label={tr('Full name')}
                columns={columns}
                onSelect={(n) => setConfig((c) => ({ ...c, fullName: n }))}
                required
                patterns={['фио']}
                antiPatterns={['фг']}
            />
            <ColumnSelect
                label={tr('Unit id')}
                columns={columns}
                onSelect={(n) => setConfig((c) => ({ ...c, unitId: n }))}
                patterns={['ид']}
            />
            <ColumnSelect
                label={tr('Personnel number')}
                columns={columns}
                onSelect={(n) => setConfig((c) => ({ ...c, personnelNumber: n }))}
                patterns={['тн']}
            />
            <ColumnSelect
                label={tr('Role')}
                columns={columns}
                onSelect={(n) => setConfig((c) => ({ ...c, role: n }))}
                patterns={['роль']}
            />
            <ColumnSelect
                label={tr('Percent')}
                columns={columns}
                onSelect={(n) => setConfig((c) => ({ ...c, percent: n }))}
                patterns={['загрузка']}
            />
            {Array.from({ length: groupCount }).map((v, i) => (
                <FormControl key={i} label={`${tr('Group')} ${i + 1}`}>
                    <div className={s.ParseTeamStructurePageGroupSelects}>
                        <ColumnSelect
                            label={tr('Name')}
                            columns={columns}
                            required
                            onSelect={(n) =>
                                setConfig((c) => {
                                    const { groups } = c;
                                    groups[i] = { name: n, lead: groups[i].lead };
                                    return { ...c, groups };
                                })
                            }
                            patterns={['функциональная', `${i + 1}`]}
                            antiPatterns={['фио', 'lead']}
                        />
                        <ColumnSelect
                            label={tr('Lead')}
                            columns={columns}
                            onSelect={(n) =>
                                setConfig((c) => {
                                    const { groups } = c;
                                    groups[i] = { name: groups[i].name, lead: n };
                                    return { ...c, groups };
                                })
                            }
                            patterns={['фг', 'фио', `${i + 1}`]}
                        />
                    </div>
                </FormControl>
            ))}
            <Button
                text={tr('Add group')}
                onClick={() => {
                    setConfig((c) => ({ ...c, groups: [...c.groups, { name: 0 }] }));
                    setGroupCount((i) => i + 1);
                }}
                className={s.ParseTeamStructurePageButton}
            />

            {nullable(
                error,
                (e) => (
                    <Alert view="warning" text={e} className={s.ParseTeamStructurePageField} />
                ),
                nullable(
                    success,
                    () => (
                        <Alert
                            view="default"
                            text={tr('Parsed data will be sent to your email')}
                            className={s.ParseTeamStructurePageField}
                        />
                    ),
                    <Button
                        view="primary"
                        text={tr('Upload')}
                        onClick={upload}
                        disabled={loading}
                        iconRight={loading ? <Spinner size="xs" /> : undefined}
                        className={s.ParseTeamStructurePageButton}
                    />,
                ),
            )}
        </div>
    );
};

export const ParseTeamStructurePage = () => {
    const [file, setFile] = useState<File>();
    const [sheets, setSheets] = useState<string[]>();

    const [sheet, setSheet] = useState<string>();
    const [columns, setColumns] = useState<string[]>();

    useEffect(() => {
        const asyncWrapper = async () => {
            if (!file || !sheet) return;
            const data = await readXlsxFile(file, { sheet });
            const firstRow = data[0];
            if (!firstRow) return;
            setColumns(firstRow.map(String));
        };
        asyncWrapper();
    }, [file, sheet]);

    return (
        <LayoutMain pageTitle={tr('Parse team structure')}>
            <CommonHeader title={tr('Parse team structure')} />
            <PageContent>
                <ExcelFileUpload
                    setData={(file, sheets) => {
                        setFile(file);
                        setSheets(sheets);
                    }}
                />
                {nullable(file, (f) => (
                    <>
                        <Badge size="s" view="secondary" className={s.ParseTeamStructurePageFilename} text={f.name} />
                        <SheetSelect sheet={sheet} sheets={sheets} onSelect={(s) => setSheet(s)} />
                        {nullable(columns, (c) => (
                            <Configurator columns={c} file={f} sheet={sheet} />
                        ))}
                    </>
                ))}
            </PageContent>
        </LayoutMain>
    );
};
