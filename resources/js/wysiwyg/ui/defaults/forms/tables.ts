import {
    EditorFormDefinition,
    EditorFormFieldDefinition,
    EditorFormTabs,
    EditorSelectFormFieldDefinition
} from "../../framework/forms";
import {EditorUiContext} from "../../framework/core";
import {CustomTableCellNode} from "../../../nodes/custom-table-cell";
import {EditorFormModal} from "../../framework/modals";
import {$getSelection, ElementFormatType} from "lexical";
import {
    $forEachTableCell, $getCellPaddingForTable,
    $getTableCellColumnWidth,
    $getTableCellsFromSelection, $getTableFromSelection,
    $getTableRowsFromSelection,
    $setTableCellColumnWidth
} from "../../../utils/tables";
import {formatSizeValue} from "../../../utils/dom";
import {CustomTableRowNode} from "../../../nodes/custom-table-row";
import {CustomTableNode} from "../../../nodes/custom-table";

const borderStyleInput: EditorSelectFormFieldDefinition = {
    label: 'Border style',
    name: 'border_style',
    type: 'select',
    valuesByLabel: {
        'Select...': '',
        "Solid": 'solid',
        "Dotted": 'dotted',
        "Dashed": 'dashed',
        "Double": 'double',
        "Groove": 'groove',
        "Ridge": 'ridge',
        "Inset": 'inset',
        "Outset": 'outset',
        "None": 'none',
        "Hidden": 'hidden',
    }
};

const borderColorInput: EditorFormFieldDefinition = {
    label: 'Border color',
    name: 'border_color',
    type: 'text',
};

const backgroundColorInput: EditorFormFieldDefinition = {
    label: 'Background color',
    name: 'background_color',
    type: 'text',
};

const alignmentInput: EditorSelectFormFieldDefinition = {
    label: 'Alignment',
    name: 'align',
    type: 'select',
    valuesByLabel: {
        'None': '',
        'Left': 'left',
        'Center': 'center',
        'Right': 'right',
    }
};

export function $showCellPropertiesForm(cell: CustomTableCellNode, context: EditorUiContext): EditorFormModal {
    const styles = cell.getStyles();
    const modalForm = context.manager.createModal('cell_properties');
    modalForm.show({
        width: $getTableCellColumnWidth(context.editor, cell),
        height: styles.get('height') || '',
        type: cell.getTag(),
        h_align: cell.getFormatType(),
        v_align: styles.get('vertical-align') || '',
        border_width: styles.get('border-width') || '',
        border_style: styles.get('border-style') || '',
        border_color: styles.get('border-color') || '',
        background_color: styles.get('background-color') || '',
    });
    return modalForm;
}

export const cellProperties: EditorFormDefinition = {
    submitText: 'Save',
    async action(formData, context: EditorUiContext) {
        context.editor.update(() => {
            const cells = $getTableCellsFromSelection($getSelection());
            for (const cell of cells) {
                const width = formData.get('width')?.toString() || '';

                $setTableCellColumnWidth(cell, width);
                cell.updateTag(formData.get('type')?.toString() || '');
                cell.setFormat((formData.get('h_align')?.toString() || '') as ElementFormatType);

                const styles = cell.getStyles();
                styles.set('height', formatSizeValue(formData.get('height')?.toString() || ''));
                styles.set('vertical-align', formData.get('v_align')?.toString() || '');
                styles.set('border-width', formatSizeValue(formData.get('border_width')?.toString() || ''));
                styles.set('border-style', formData.get('border_style')?.toString() || '');
                styles.set('border-color', formData.get('border_color')?.toString() || '');
                styles.set('background-color', formData.get('background_color')?.toString() || '');

                cell.setStyles(styles);
            }
        });

        return true;
    },
    fields: [
        {
            build() {
                const generalFields: EditorFormFieldDefinition[] = [
                    {
                        label: 'Width', // Colgroup width
                        name: 'width',
                        type: 'text',
                    },
                    {
                        label: 'Height', // inline-style: height
                        name: 'height',
                        type: 'text',
                    },
                    {
                        label: 'Cell type', // element
                        name: 'type',
                        type: 'select',
                        valuesByLabel: {
                            'Cell': 'td',
                            'Header cell': 'th',
                        }
                    } as EditorSelectFormFieldDefinition,
                    {
                        ...alignmentInput, // class: 'align-right/left/center'
                        label: 'Horizontal align',
                        name: 'h_align',
                    },
                    {
                        label: 'Vertical align', // inline-style: vertical-align
                        name: 'v_align',
                        type: 'select',
                        valuesByLabel: {
                            'None': '',
                            'Top': 'top',
                            'Middle': 'middle',
                            'Bottom': 'bottom',
                        }
                    } as EditorSelectFormFieldDefinition,
                ];

                const advancedFields: EditorFormFieldDefinition[] = [
                    {
                        label: 'Border width', // inline-style: border-width
                        name: 'border_width',
                        type: 'text',
                    },
                    borderStyleInput, // inline-style: border-style
                    borderColorInput, // inline-style: border-color
                    backgroundColorInput, // inline-style: background-color
                ];

                return new EditorFormTabs([
                    {
                        label: 'General',
                        contents: generalFields,
                    },
                    {
                        label: 'Advanced',
                        contents: advancedFields,
                    }
                ])
            }
        },
    ],
};

export function $showRowPropertiesForm(row: CustomTableRowNode, context: EditorUiContext): EditorFormModal {
    const styles = row.getStyles();
    const modalForm = context.manager.createModal('row_properties');
    modalForm.show({
        height: styles.get('height') || '',
        border_style: styles.get('border-style') || '',
        border_color: styles.get('border-color') || '',
        background_color: styles.get('background-color') || '',
    });
    return modalForm;
}

export const rowProperties: EditorFormDefinition = {
    submitText: 'Save',
    async action(formData, context: EditorUiContext) {
        context.editor.update(() => {
            const rows = $getTableRowsFromSelection($getSelection());
            for (const row of rows) {
                const styles = row.getStyles();
                styles.set('height', formatSizeValue(formData.get('height')?.toString() || ''));
                styles.set('border-style', formData.get('border_style')?.toString() || '');
                styles.set('border-color', formData.get('border_color')?.toString() || '');
                styles.set('background-color', formData.get('background_color')?.toString() || '');
                row.setStyles(styles);
            }
        });
        return true;
    },
    fields: [
        // Removed fields:
        // Removed 'Row Type' as we don't currently support thead/tfoot elements
        //  TinyMCE would move rows up/down into these parents when set
        // Removed 'Alignment' since this was broken in our editor (applied alignment class to whole parent table)
        {
            label: 'Height', // style on tr: height
            name: 'height',
            type: 'text',
        },
        borderStyleInput, // style on tr: height
        borderColorInput, // style on tr: height
        backgroundColorInput, // style on tr: height
    ],
};

export function $showTablePropertiesForm(table: CustomTableNode, context: EditorUiContext): EditorFormModal {
    const styles = table.getStyles();
    const modalForm = context.manager.createModal('table_properties');
    modalForm.show({
        width: styles.get('width') || '',
        height: styles.get('height') || '',
        cell_spacing: styles.get('cell-spacing') || '',
        cell_padding: $getCellPaddingForTable(table),
        border_width: styles.get('border-width') || '',
        border_style: styles.get('border-style') || '',
        border_color: styles.get('border-color') || '',
        background_color: styles.get('background-color') || '',
        // caption: '', TODO
        align: table.getFormatType(),
    });
    return modalForm;
}

export const tableProperties: EditorFormDefinition = {
    submitText: 'Save',
    async action(formData, context: EditorUiContext) {
        context.editor.update(() => {
            const table = $getTableFromSelection($getSelection());
            if (!table) {
                return;
            }

            const styles = table.getStyles();
            styles.set('width', formatSizeValue(formData.get('width')?.toString() || ''));
            styles.set('height', formatSizeValue(formData.get('height')?.toString() || ''));
            styles.set('cell-spacing', formatSizeValue(formData.get('cell_spacing')?.toString() || ''));
            styles.set('border-width', formatSizeValue(formData.get('border_width')?.toString() || ''));
            styles.set('border-style', formData.get('border_style')?.toString() || '');
            styles.set('border-color', formData.get('border_color')?.toString() || '');
            styles.set('background-color', formData.get('background_color')?.toString() || '');
            table.setStyles(styles);

            table.setFormat(formData.get('align') as ElementFormatType);

            const cellPadding = (formData.get('cell_padding')?.toString() || '');
            if (cellPadding) {
                const cellPaddingFormatted = formatSizeValue(cellPadding);
                $forEachTableCell(table, (cell: CustomTableCellNode) => {
                    const styles = cell.getStyles();
                    styles.set('padding', cellPaddingFormatted);
                    cell.setStyles(styles);
                });
            }

            // TODO - cell caption
        });
        return true;
    },
    fields: [
        {
            build() {
                const generalFields: EditorFormFieldDefinition[] = [
                    {
                        label: 'Width', // Style - width
                        name: 'width',
                        type: 'text',
                    },
                    {
                        label: 'Height', // Style - height
                        name: 'height',
                        type: 'text',
                    },
                    {
                        label: 'Cell spacing', // Style - border-spacing
                        name: 'cell_spacing',
                        type: 'text',
                    },
                    {
                        label: 'Cell padding', // Style - padding on child cells?
                        name: 'cell_padding',
                        type: 'text',
                    },
                    {
                        label: 'Border width', // Style - border-width
                        name: 'border_width',
                        type: 'text',
                    },
                    {
                        label: 'caption', // Caption element
                        name: 'caption',
                        type: 'text', // TODO -
                    },
                    alignmentInput, // alignment class
                ];

                const advancedFields: EditorFormFieldDefinition[] = [
                    borderStyleInput, // Style - border-style
                    borderColorInput, // Style - border-color
                    backgroundColorInput, // Style - background-color
                ];

                return new EditorFormTabs([
                    {
                        label: 'General',
                        contents: generalFields,
                    },
                    {
                        label: 'Advanced',
                        contents: advancedFields,
                    }
                ])
            }
        },
    ],
};