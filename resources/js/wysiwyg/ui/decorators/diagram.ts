import {EditorDecorator} from "../framework/decorator";
import {EditorUiContext} from "../framework/core";
import {BaseSelection} from "lexical";
import {DiagramNode} from "../../nodes/diagram";
import {$selectionContainsNode, $selectSingleNode} from "../../utils/selection";
import {$openDrawingEditorForNode} from "../../utils/diagrams";


export class DiagramDecorator extends EditorDecorator {
    protected completedSetup: boolean = false;

    setup(context: EditorUiContext, element: HTMLElement) {
        const diagramNode = this.getNode();
        element.classList.add('editor-diagram');
        element.addEventListener('click', event => {
            context.editor.update(() => {
                $selectSingleNode(this.getNode());
            })
        });

        element.addEventListener('dblclick', event => {
            context.editor.getEditorState().read(() => {
                $openDrawingEditorForNode(context, (this.getNode() as DiagramNode));
            });
        });

        const selectionChange = (selection: BaseSelection|null): void => {
            element.classList.toggle('selected', $selectionContainsNode(selection, diagramNode));
        };
        context.manager.onSelectionChange(selectionChange);
        this.onDestroy(() => {
            context.manager.offSelectionChange(selectionChange);
        });

        this.completedSetup = true;
    }

    update() {
        //
    }

    render(context: EditorUiContext, element: HTMLElement): void {
        if (this.completedSetup) {
            this.update();
        } else {
            this.setup(context, element);
        }
    }
}