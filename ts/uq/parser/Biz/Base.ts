import { BizBase, BizAtom, BizBud, BizBudChar, BizBudCheck, BizBudDate, BizBudDec, BizBudID, BizBudInt, BizBudRadio, BizEntity, BizSpec, BizBudNone, ID, BizBudAtom, Uq, IX } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";

export abstract class PBizBase<B extends BizBase> extends PElement<B> {
    protected abstract get defaultName(): string;

    protected _parse(): void {
        let jName: string;
        const { token } = this.ts;
        if (token === Token.VAR) {
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        else if (token === Token.DOLLARVAR || token === Token.DOLLAR) {
            if (this.context.isSys === true) {
                this.element.name = this.ts.lowerVar;
                jName = this.ts._var;
                this.ts.readToken();
            }
            else {
                this.ts.error('$ can not be in a entity name');
            }
        }
        else {
            let defName = this.defaultName;
            if (defName === undefined) {
                this.ts.expect(`name of ${this.element.type}`);
            }
            this.element.name = defName;
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.NUM) {
                this.ts.expectToken(Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        if (this.ts.token === Token.STRING) {
            this.element.caption = this.ts.text;
            this.ts.readToken();
        }
        else {
            if (jName !== this.element.name) {
                this.element.caption = jName;
            }
        }
        this.element.setJName(jName);
        this.parseParam();
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            if (this.ts.token === Token.RBRACE as any) {
                this.ts.readToken();
                this.ts.mayPassToken(Token.SEMICOLON);
                return;
            }
            this.parseContent();
            this.ts.passToken(Token.RBRACE);
            this.ts.mayPassToken(Token.SEMICOLON);
        }
        else {
            this.ts.passToken(Token.SEMICOLON);
        }
    }

    protected parseParam(): void {
    }

    protected parseContent(): void {
    }

    protected parseDefault(): void {
    }

    scanAtom(space: Space, atomName: string): BizAtom {
        let Atom = space.uq.biz.bizEntities.get(atomName);
        if (Atom === undefined || Atom.type !== 'atom') {
            this.log(`${atomName} is not an Atom`);
            return undefined;
        }
        else {
            return Atom as BizAtom;
        }
    }

    scanID(space: Space, idName: string): ID {
        let entity = space.uq.entities[idName];
        if (entity === undefined || entity.type !== 'id') {
            this.log(`${idName} is not an ID`);
            return undefined;
        }
        else {
            return entity as ID;
        }
    }

    scanIX(space: Space, ixName: string): IX {
        let entity = space.uq.entities[ixName];
        if (entity === undefined || entity.type !== 'ix') {
            this.log(`${ixName} is not an IX`);
            return undefined;
        }
        else {
            return entity as IX;
        }
    }

    scanSpec(space: Space, SpecName: string): BizSpec {
        let Spec = space.uq.biz.bizEntities.get(SpecName);
        if (Spec === undefined || Spec.type !== 'spec') {
            this.log(`${SpecName} is not an Spec`);
            return undefined;
        }
        else {
            return Spec as BizSpec;
        }
    }

    getBizEntity<T extends BizEntity>(space: Space, entityName: string, entityType: string): T {
        let bizEntity = space.uq.biz.bizEntities.get(entityName);
        if (bizEntity !== undefined && bizEntity.type === entityType) {
            return bizEntity as T;
        }
        this.log(`${entityName} is not a Biz ${entityType.toUpperCase()}`);
        return undefined;
    }
}

const names = ['id', 'ix', 'idx', 'item', 'base', 'no', 'value', 'v1', 'v2', 'v3', 'operator'];
const invalidPropNames: { [key: string]: boolean } = (function () {
    let ret = {};
    for (let v of names) {
        ret[v] = true;
    }
    return ret;
})();

export abstract class PBizEntity<B extends BizEntity> extends PBizBase<B> {
    protected parseSubItem(type: string): BizBud {
        this.ts.assertToken(Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        if (this.isValidPropName(name) === false) {
            return;
        }
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(type, name, caption);
        this.ts.passToken(Token.SEMICOLON);
        return bizBud;
    }

    protected isValidPropName(prop: string): boolean {
        if (invalidPropNames[prop] === true) {
            this.ts.error(`${names.join(',')} can not be used as Prop name`);
            return false;
        }
        return true;
    }

    protected parseBud(type: string, name: string, caption: string): BizBud {
        const keyColl: { [key: string]: new (type: string, name: string, caption: string) => BizBud } = {
            none: BizBudNone,
            int: BizBudInt,
            dec: BizBudDec,
            char: BizBudChar,
            id: BizBudID,
            atom: BizBudAtom,
            date: BizBudDate,
            radio: BizBudRadio,
            check: BizBudCheck,
        }
        const keys = Object.keys(keyColl);
        let key = this.ts.lowerVar;
        if (this.ts.token === Token.SEMICOLON) {
            key = 'none';
        }
        else {
            if (this.ts.varBrace === true) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
        }
        let Bud = keyColl[key];
        if (Bud === undefined) {
            this.ts.expect(...keys);
        }
        let bizBud = new Bud(type, name, caption);
        bizBud.parser(this.context).parse();

        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
            let value: string | number;
            switch (this.ts.token as any) {
                default: this.ts.expectToken(Token.STRING, Token.NUM); break;
                case Token.STRING: value = this.ts.text; break;
                case Token.NUM: value = this.ts.dec; break;
            }
            bizBud.value = value;
            this.ts.readToken();
        }

        if (this.ts.isKeyword('history') === true) {
            bizBud.hasHistory = true;
            this.ts.readToken();
        }

        if (this.element.checkName(name) === false) {
            this.ts.error(`${name} can not be used multiple times`);
        }

        if (this.ts.isKeyword('index') === true) {
            bizBud.hasIndex = true;
            this.ts.readToken();
        }
        return bizBud;
    }

    protected parseProp = () => {
        let prop = this.parseSubItem('prop');
        this.element.props.set(prop.name, prop);
    }

    protected parseAssign = () => {
        let prop = this.parseSubItem('assign');
        this.element.assigns.set(prop.name, prop);
    }

    protected scanBud(space: Space, bud: BizBud): boolean {
        let { pelement } = bud;
        if (pelement === undefined) return true;
        if (pelement.scan(space) === false) return false;
        return true;
    }

    private scanBuds(space: Space, buds: Map<string, BizBud>) {
        let ok = true;
        for (let [, value] of buds) {
            if (this.scanBud(space, value) === false) ok = false;
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { props, assigns } = this.element;
        if (this.scanBuds(space, props) === false) ok = false;
        if (this.scanBuds(space, assigns) === false) ok = false;
        return ok;
    }

    private scan2Buds(uq: Uq, buds: Map<string, BizBud>) {
        let ok = true;
        for (let [, value] of buds) {
            let { pelement } = value;
            if (pelement === undefined) continue;
            if (pelement.scan2(uq) === false) ok = false;
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        const { props, assigns } = this.element;
        if (this.scan2Buds(uq, props) === false) ok = false;
        if (this.scan2Buds(uq, assigns) === false) ok = false;
        return ok;
    }
}
