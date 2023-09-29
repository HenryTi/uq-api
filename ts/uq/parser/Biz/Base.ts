import {
    BizBase, BizAtom, BizBud, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, /*BizBudID, */BizBudInt, BizBudRadio, BizEntity
    , BizBudNone, ID, BizBudAtom, Uq, IX, BudFlag, BizBudIntOf, BizAtomID, BizPhraseType, ValueExpression, BudValueAct
} from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";

export abstract class PBizBase<B extends BizBase> extends PElement<B> {
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
            this.ts.expect(`name of ${this.element.type}`);
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
        /*
        else {
            if (jName !== this.element.name) {
                this.element.caption = jName;
            }
        }
        */
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

    scanAtomID(space: Space, atomName: string): BizAtomID {
        let Atom = space.uq.biz.bizEntities.get(atomName);
        const types = [BizPhraseType.atom, BizPhraseType.spec, BizPhraseType.bud];
        if (Atom === undefined || types.indexOf(Atom.bizPhraseType) < 0) {
            this.log(`${atomName} is not an Atom ID`);
            return undefined;
        }
        else {
            return Atom as BizAtomID;
        }
    }

    getBizEntity<T extends BizEntity>(space: Space, entityName: string, ...bizPhraseType: BizPhraseType[]): T {
        let bizEntity = space.uq.biz.bizEntities.get(entityName);
        if (bizPhraseType === undefined || bizPhraseType.length === 0) {
            if (bizEntity !== undefined) {
                return bizEntity as T;
            }
            this.log(`${entityName} is not a Biz Entity`);
            return undefined;
        }
        if (bizEntity !== undefined) {
            if (bizPhraseType.indexOf(bizEntity.bizPhraseType) >= 0) {
                return bizEntity as T;
            }
        }
        this.log(`${entityName} is not a Biz ${bizPhraseType.map(v => BizPhraseType[v]).join(', ')}`);
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
    protected saveSource() {
        let entityType = this.element.type.toUpperCase();
        let source = this.getSource();
        this.element.source = entityType + ' ' + source;
    }

    protected parseSubItem(): BizBud {
        this.ts.assertToken(Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        if (this.isValidPropName(name) === false) {
            return;
        }
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(name, caption);
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

    protected parseBud(name: string, caption: string): BizBud {
        const keyColl: { [key: string]: new (name: string, caption: string) => BizBud } = {
            none: BizBudNone,
            int: BizBudInt,
            dec: BizBudDec,
            char: BizBudChar,
            atom: BizBudAtom,
            date: BizBudDate,
            intof: BizBudIntOf,
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
            if (key === 'int') {
                this.ts.readToken()
                if (this.ts.isKeyword('of') === true) {
                    key = 'intof';
                    this.ts.readToken();
                }
            }
            else {
                this.ts.readToken();
            }
        }
        let Bud = keyColl[key];
        if (Bud === undefined) {
            this.ts.expect(...keys);
        }
        let bizBud = new Bud(name, caption);
        bizBud.parser(this.context).parse();

        let act: BudValueAct;
        switch (this.ts.token) {
            case Token.EQU: act = BudValueAct.equ; break;
            case Token.COLONEQU: act = BudValueAct.init; break;
        }
        if (act !== undefined) {
            this.ts.readToken();
            let value = new ValueExpression();
            this.context.parseElement(value);
            bizBud.value = {
                exp: value,
                act,
            };
        }

        if (this.ts.isKeyword('history') === true) {
            bizBud.hasHistory = true;
            this.ts.readToken();
        }

        if (this.element.checkName(name) === false) {
            this.ts.error(`${name} can not be used multiple times`);
        }
        if (this.ts.isKeyword('index') === true) {
            if (bizBud.canIndex === true) {
                bizBud.flag |= BudFlag.index;
                this.ts.readToken();
            }
            else {
                this.ts.error('only int or atom can index');
            }
        }
        return bizBud;
    }

    protected parseProp = () => {
        let prop = this.parseSubItem();
        this.element.props.set(prop.name, prop);
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
        const { props } = this.element;
        if (this.scanBuds(space, props) === false) ok = false;
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
        const { props } = this.element;
        if (this.scan2Buds(uq, props) === false) ok = false;
        // if (this.scan2Buds(uq, assigns) === false) ok = false;
        return ok;
    }
}
