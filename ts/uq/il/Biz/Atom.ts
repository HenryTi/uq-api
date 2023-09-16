import { PBizAtom, PBizAtomState, PBizSpec, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizBase } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";
import { BizSpec } from "./Spec";

export class BizAtom extends BizEntity {
    readonly type = 'atom';
    extends: BizAtom;
    base: BizAtom;
    keys: BizBud[] = [];
    ex: BizBud;
    spec: BizSpec;
    uom: boolean;
    uuid: boolean;
    sqlIdFromKeyArr: string;

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let _extends: string;
        if (this.extends !== undefined) {
            _extends = this.extends.name;
        }
        let spec: string;
        if (this.spec !== undefined) {
            spec = this.spec.name;
        }

        let entitySchema = {
            name: this.name,
            type: "id",
            biz: "atom",
            private: false,
            sys: true,
            global: false,
            idType: 3,
            isMinute: false,
        };
        this.entitySchema = JSON.stringify(entitySchema);

        return Object.assign(ret, { extends: _extends, spec, uom: this.uom });
    }
    get basePhrase(): string { return this.extends === undefined ? '' : this.extends.phrase; }
    private getUom(): boolean {
        if (this.uom === true) return true;
        if (this.extends === undefined) return;
        return this.extends.getUom();
    }
    setUom() {
        if (this.uom === true) return true;
        if (this.extends !== undefined) {
            this.uom = this.extends.getUom();
        }
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        /*
        for (let [, value] of this.states) {
            value.buildPhrases(phrases, this.phrase)
        }
        */
    }
}

export class BizAtomState extends BizBase {
    readonly type = 'atomstate';
    parser(context: PContext): PElement<IElement> {
        return new PBizAtomState(this, context);
    }
}
