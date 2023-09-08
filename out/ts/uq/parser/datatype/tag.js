"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
import { Tag, TagDataType } from "../../il";
import { PContext } from "../pContext";
import { Token } from "../tokens";
import { Space } from "../element";

export class PTagDataType extends PDataType {
    private tagDataType: TagDataType;
    constructor(tagDataType: TagDataType, context: PContext) {
        super(tagDataType, context);
        this.tagDataType = tagDataType;
    }

    protected _parse() {
        switch (this.ts.token) {
        default: return true;
        case Token.VAR:
            this.tagDataType.tagType = this.ts.lowerVar;
            break;
        }
        this.ts.readToken();
        return true;
    }

    scanReturnMessage(space: Space): string {
        let {tag, tagType} = this.tagDataType;
        if (tag !== undefined) return;
        if (tagType === undefined) return;
        let entity = space.getEntity(tagType);
        if (entity === undefined) return tagType + ' 不存在';
        if (entity.type !== 'tag') return tagType + ' 必须是Tag';
        let t = entity as Tag;
        this.tagDataType.tag = tag;
    }
}
*/ 
//# sourceMappingURL=tag.js.map