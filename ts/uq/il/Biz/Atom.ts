import { PBizAtom, PBizAtomState, PBizSpec, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { idField } from "../field";
import { BizBase } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export class BizSpec extends BizEntity {
    readonly type = 'spec';
    readonly keys: Map<string, BizBud> = new Map();
    parser(context: PContext): PElement<IElement> {
        return new PBizSpec(this, context);
    }

    buildFields(): void {
        for (let [, value] of this.keys) {
            this.keyFields.push(this.buildField(value));
        }
        for (let [, value] of this.props) {
            this.propFields.push(this.buildField(value));
        }
    }

    buildSchema() {
        let ret = super.buildSchema();
        let keys = [];
        for (let [, value] of this.keys) {
            keys.push(value.buildSchema());
        }
        if (keys.length === 0) keys = undefined;

        let id = idField('id', 'big');
        let entitySchema = {
            name: this.name,
            type: "id",
            biz: "spec",
            private: false,
            sys: true,
            global: false,
            idType: 3,
            isMinute: false,
            keys: this.keyFields,
            fields: [
                id,
                ...this.keyFields,
                ...this.propFields
            ],
        };
        this.entitySchema = JSON.stringify(entitySchema);
        return Object.assign(ret, { keys });
    }
}

export class BizAtom extends BizEntity {
    readonly type = 'atom';
    base: BizAtom;
    spec: BizSpec;
    uom: boolean;
    uuid: boolean;
    readonly states: Map<string, BizAtomState> = new Map();

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    buildSchema() {
        let ret = super.buildSchema();
        let base: string;
        if (this.base !== undefined) {
            base = this.base.name;
        }
        let spec: string;
        if (this.spec !== undefined) {
            spec = this.spec.name;
        }
        let states = [];
        for (let [, value] of this.states) {
            states.push(value.buildSchema());
        }
        if (states.length === 0) states = undefined;

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

        return Object.assign(ret, { states, base, spec, uom: this.uom });
    }
    get basePhrase(): string { return this.base === undefined ? '' : this.base.phrase; }
    private getUom(): boolean {
        if (this.uom === true) return true;
        if (this.base === undefined) return;
        return this.base.getUom();
    }
    setUom() {
        if (this.uom === true) return true;
        if (this.base !== undefined) {
            this.uom = this.base.getUom();
        }
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = `${prefix}.${this.name}`;
        for (let [, value] of this.states) {
            value.buildPhrases(phrases, phrase)
        }
    }
}

export class BizAtomState extends BizBase {
    readonly type = 'atomstate';
    parser(context: PContext): PElement<IElement> {
        return new PBizAtomState(this, context);
    }
}
