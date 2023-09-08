import { PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizUnit extends BizEntity {
    name = '$unit';
    type = '$unit';
    parser(context: PContext): PElement<IElement> {
        return undefined;
    }
}