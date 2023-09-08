//import {Context, BElement} from '../builder';
import {PElement, PContext} from '../parser';

export abstract class IElement {
    pelement: PElement;
    abstract get type():string;
    abstract parser(context:PContext):PElement;
    eachChild(callback: (el: IElement, name?:string) => void) {}
}
