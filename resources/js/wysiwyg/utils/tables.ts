import {BaseSelection, LexicalEditor} from "lexical";
import {$isTableRowNode, $isTableSelection, TableRowNode, TableSelection, TableSelectionShape} from "@lexical/table";
import {$isCustomTableNode, CustomTableNode} from "../nodes/custom-table";
import {$isCustomTableCellNode, CustomTableCellNode} from "../nodes/custom-table-cell";
import {$getParentOfType} from "./nodes";
import {$getNodeFromSelection} from "./selection";
import {formatSizeValue} from "./dom";
import {TableMap} from "./table-map";
import {$isCustomTableRowNode, CustomTableRowNode} from "../nodes/custom-table-row";

function $getTableFromCell(cell: CustomTableCellNode): CustomTableNode|null {
    return $getParentOfType(cell, $isCustomTableNode) as CustomTableNode|null;
}

export function getTableColumnWidths(table: HTMLTableElement): string[] {
    const maxColRow = getMaxColRowFromTable(table);

    const colGroup = table.querySelector('colgroup');
    let widths: string[] = [];
    if (colGroup && (colGroup.childElementCount === maxColRow?.childElementCount || !maxColRow)) {
        widths = extractWidthsFromRow(colGroup);
    }
    if (widths.filter(Boolean).length === 0 && maxColRow) {
        widths = extractWidthsFromRow(maxColRow);
    }

    return widths;
}

function getMaxColRowFromTable(table: HTMLTableElement): HTMLTableRowElement | null {
    const rows = table.querySelectorAll('tr');
    let maxColCount: number = 0;
    let maxColRow: HTMLTableRowElement | null = null;

    for (const row of rows) {
        if (row.childElementCount > maxColCount) {
            maxColRow = row;
            maxColCount = row.childElementCount;
        }
    }

    return maxColRow;
}

function extractWidthsFromRow(row: HTMLTableRowElement | HTMLTableColElement) {
    return [...row.children].map(child => extractWidthFromElement(child as HTMLElement))
}

function extractWidthFromElement(element: HTMLElement): string {
    let width = element.style.width || element.getAttribute('width');
    if (width && !Number.isNaN(Number(width))) {
        width = width + 'px';
    }

    return width || '';
}

export function $setTableColumnWidth(node: CustomTableNode, columnIndex: number, width: number|string): void {
    const rows = node.getChildren() as TableRowNode[];
    let maxCols = 0;
    for (const row of rows) {
        const cellCount = row.getChildren().length;
        if (cellCount > maxCols) {
            maxCols = cellCount;
        }
    }

    let colWidths = node.getColWidths();
    if (colWidths.length === 0 || colWidths.length < maxCols) {
        colWidths = Array(maxCols).fill('');
    }

    if (columnIndex + 1 > colWidths.length) {
        console.error(`Attempted to set table column width for column [${columnIndex}] but only ${colWidths.length} columns found`);
    }

    colWidths[columnIndex] = formatSizeValue(width);
    node.setColWidths(colWidths);
}

export function $getTableColumnWidth(editor: LexicalEditor, node: CustomTableNode, columnIndex: number): number {
    const colWidths = node.getColWidths();
    if (colWidths.length > columnIndex && colWidths[columnIndex].endsWith('px')) {
        return Number(colWidths[columnIndex].replace('px', ''));
    }

    // Otherwise, get from table element
    const table = editor.getElementByKey(node.__key) as HTMLTableElement | null;
    if (table) {
        const maxColRow = getMaxColRowFromTable(table);
        if (maxColRow && maxColRow.children.length > columnIndex) {
            const cell = maxColRow.children[columnIndex];
            return cell.clientWidth;
        }
    }

    return 0;
}

function $getCellColumnIndex(node: CustomTableCellNode): number {
    const row = node.getParent();
    if (!$isTableRowNode(row)) {
        return -1;
    }

    let index = 0;
    const cells = row.getChildren<CustomTableCellNode>();
    for (const cell of cells) {
        let colSpan = cell.getColSpan() || 1;
        index += colSpan;
        if (cell.getKey() === node.getKey()) {
            break;
        }
    }

    return index - 1;
}

export function $setTableCellColumnWidth(cell: CustomTableCellNode, width: string): void {
    const table = $getTableFromCell(cell)
    const index = $getCellColumnIndex(cell);

    if (table && index >= 0) {
        $setTableColumnWidth(table, index, width);
    }
}

export function $getTableCellColumnWidth(editor: LexicalEditor, cell: CustomTableCellNode): string {
    const table = $getTableFromCell(cell)
    const index = $getCellColumnIndex(cell);
    if (!table) {
        return '';
    }

    const widths = table.getColWidths();
    return (widths.length > index) ? widths[index] : '';
}

export function $getTableCellsFromSelection(selection: BaseSelection|null): CustomTableCellNode[]  {
    if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        return nodes.filter(n => $isCustomTableCellNode(n));
    }

    const cell = $getNodeFromSelection(selection, $isCustomTableCellNode) as CustomTableCellNode;
    return cell ? [cell] : [];
}

export function $mergeTableCellsInSelection(selection: TableSelection): void {
    const selectionShape = selection.getShape();
    const cells = $getTableCellsFromSelection(selection);
    if (cells.length === 0) {
        return;
    }

    const table = $getTableFromCell(cells[0]);
    if (!table) {
        return;
    }

    const tableMap = new TableMap(table);
    const headCell = tableMap.getCellAtPosition(selectionShape.toX, selectionShape.toY);
    if (!headCell) {
        return;
    }

    // We have to adjust the shape since it won't take into account spans for the head corner position.
    const fixedToX = selectionShape.toX + ((headCell.getColSpan() || 1) - 1);
    const fixedToY = selectionShape.toY + ((headCell.getRowSpan() || 1) - 1);

    const mergeCells = tableMap.getCellsInRange({
        fromX: selectionShape.fromX,
        fromY: selectionShape.fromY,
        toX: fixedToX,
        toY: fixedToY,
    });

    if (mergeCells.length === 0) {
        return;
    }

    const firstCell = mergeCells[0];
    const newWidth = Math.abs(selectionShape.fromX - fixedToX) + 1;
    const newHeight = Math.abs(selectionShape.fromY - fixedToY) + 1;

    for (let i = 1; i < mergeCells.length; i++) {
        const mergeCell = mergeCells[i];
        firstCell.append(...mergeCell.getChildren());
        mergeCell.remove();
    }

    firstCell.setColSpan(newWidth);
    firstCell.setRowSpan(newHeight);
}

export function $getTableRowsFromSelection(selection: BaseSelection|null): CustomTableRowNode[] {
    const cells = $getTableCellsFromSelection(selection);
    const rowsByKey: Record<string, CustomTableRowNode> = {};
    for (const cell of cells) {
        const row = cell.getParent();
        if ($isCustomTableRowNode(row)) {
            rowsByKey[row.getKey()] = row;
        }
    }

    return Object.values(rowsByKey);
}

export function $getTableFromSelection(selection: BaseSelection|null): CustomTableNode|null {
    const cells = $getTableCellsFromSelection(selection);
    if (cells.length === 0) {
        return null;
    }

    const table = $getParentOfType(cells[0], $isCustomTableNode);
    if ($isCustomTableNode(table)) {
        return table;
    }

    return null;
}

export function $clearTableSizes(table: CustomTableNode): void {
    table.setColWidths([]);

    // TODO - Extra form things once table properties and extra things
    //   are supported

    for (const row of table.getChildren()) {
        if (!$isCustomTableRowNode(row)) {
            continue;
        }

        const rowStyles = row.getStyles();
        rowStyles.delete('height');
        rowStyles.delete('width');
        row.setStyles(rowStyles);

        const cells = row.getChildren().filter(c => $isCustomTableCellNode(c));
        for (const cell of cells) {
            const cellStyles = cell.getStyles();
            cellStyles.delete('height');
            cellStyles.delete('width');
            cell.setStyles(cellStyles);
            cell.clearWidth();
        }
    }
}

export function $clearTableFormatting(table: CustomTableNode): void {
    table.setColWidths([]);
    table.setStyles(new Map);

    for (const row of table.getChildren()) {
        if (!$isCustomTableRowNode(row)) {
            continue;
        }

        row.setStyles(new Map);
        row.setFormat('');

        const cells = row.getChildren().filter(c => $isCustomTableCellNode(c));
        for (const cell of cells) {
            cell.setStyles(new Map);
            cell.clearWidth();
            cell.setFormat('');
        }
    }
}

/**
 * Perform the given callback for each cell in the given table.
 * Returning false from the callback stops the function early.
 */
export function $forEachTableCell(table: CustomTableNode, callback: (c: CustomTableCellNode) => void|false): void {
    outer: for (const row of table.getChildren()) {
        if (!$isCustomTableRowNode(row)) {
            continue;
        }
        const cells = row.getChildren();
        for (const cell of cells) {
            if (!$isCustomTableCellNode(cell)) {
                return;
            }
            const result = callback(cell);
            if (result === false) {
                break outer;
            }
        }
    }
}

export function $getCellPaddingForTable(table: CustomTableNode): string {
    let padding: string|null = null;

    $forEachTableCell(table, (cell: CustomTableCellNode) => {
        const cellPadding = cell.getStyles().get('padding') || ''
        if (padding === null) {
            padding = cellPadding;
        }

        if (cellPadding !== padding) {
            padding = null;
            return false;
        }
    });

    return padding || '';
}








