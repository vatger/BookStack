import {handleDropdown} from "../helpers/dropdowns";
import {EditorContainerUiElement, EditorUiElement} from "../core";
import {EditorBasicButtonDefinition, EditorButton} from "../buttons";
import {el} from "../../../utils/dom";
import {EditorMenuButton} from "./menu-button";

export type EditorDropdownButtonOptions = {
    showOnHover?: boolean;
    direction?: 'vertical'|'horizontal';
    button: EditorBasicButtonDefinition|EditorButton;
};

const defaultOptions: EditorDropdownButtonOptions = {
    showOnHover: false,
    direction: 'horizontal',
    button: {label: 'Menu'},
}

export class EditorDropdownButton extends EditorContainerUiElement {
    protected button: EditorButton;
    protected childItems: EditorUiElement[];
    protected open: boolean = false;
    protected options: EditorDropdownButtonOptions;

    constructor(options: EditorDropdownButtonOptions, children: EditorUiElement[]) {
        super(children);
        this.childItems = children;
        this.options = Object.assign({}, defaultOptions, options);

        if (options.button instanceof EditorButton) {
            this.button = options.button;
        } else {
            const type = options.button.format === 'long' ? EditorMenuButton : EditorButton;
            this.button = new type({
                ...options.button,
                action() {
                    return false;
                },
                isActive: () => {
                    return this.open;
                }
            });
        }

        this.addChildren(this.button);
    }

    insertItems(...items: EditorUiElement[]) {
        this.addChildren(...items);
        this.childItems.push(...items);
    }

    protected buildDOM(): HTMLElement {
        const button = this.button.getDOMElement();

        const childElements: HTMLElement[] = this.childItems.map(child => child.getDOMElement());
        const menu = el('div', {
            class: `editor-dropdown-menu editor-dropdown-menu-${this.options.direction}`,
            hidden: 'true',
        }, childElements);

        const wrapper = el('div', {
            class: 'editor-dropdown-menu-container',
        }, [button, menu]);

        handleDropdown({toggle: button, menu : menu,
            showOnHover: this.options.showOnHover,
            onOpen : () => {
            this.open = true;
            this.getContext().manager.triggerStateUpdateForElement(this.button);
        }, onClose : () => {
            this.open = false;
            this.getContext().manager.triggerStateUpdateForElement(this.button);
        }});

        return wrapper;
    }
}