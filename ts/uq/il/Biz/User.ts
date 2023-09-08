import { PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizUser extends BizEntity {
    name = '$user';
    type = '$user';
    parser(context: PContext): PElement<IElement> {
        return undefined;
    }
}
