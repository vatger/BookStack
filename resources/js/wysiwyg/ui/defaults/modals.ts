import {EditorFormModalDefinition} from "../framework/modals";
import {image, link, media} from "./forms/objects";
import {source} from "./forms/controls";
import {cellProperties, rowProperties, tableProperties} from "./forms/tables";

export const modals: Record<string, EditorFormModalDefinition> = {
    link: {
        title: 'Insert/Edit Link',
        form: link,
    },
    image: {
        title: 'Insert/Edit Image',
        form: image,
    },
    media: {
        title: 'Insert/Edit Media',
        form: media,
    },
    source: {
        title: 'Source code',
        form: source,
    },
    cell_properties: {
        title: 'Cell Properties',
        form: cellProperties,
    },
    row_properties: {
        title: 'Row Properties',
        form: rowProperties,
    },
    table_properties: {
        title: 'Table Properties',
        form: tableProperties,
    },
};