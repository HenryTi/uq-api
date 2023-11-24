import {
    BizBase, BizAtom, BizBudValue, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, /*BizBudID, */BizBudInt, BizBudRadio, BizEntity
    , BizBudNone, ID, BizBudAtom, Uq, IX, BudIndex, BizBudIntOf, BizAtomID, BizPhraseType, ValueExpression, BudValueAct, Permission, BizBud, SetType, Biz, BizQueryValue, BudGroup, IxField
} from "../../il";
import { UI } from "../../il/UI";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";
import { BizEntitySpace } from "./Biz";
import { PBizBudValue } from "./Bud";

export abstract class PBizBase<B extends BizBase> extends PElement<B> {
    protected _parse(): void {
        this.parseHeader();
        this.parseBody();
    }

    protected expectName() {
        this.ts.expect(`name of ${this.element.type}`);
    }

    protected nameShouldNotStartsWith$() {
        this.ts.error('$ can not be in a entity name');
    }

    protected parseHeader() {
        let jName: string;
        const { token } = this.ts;
        if (token === Token.VAR) {
            this.element.nameStartAt = this.sourceStart;
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        else if (token === Token.DOLLARVAR || token === Token.DOLLAR) {
            if (this.context.isSys === true) {
                this.element.nameStartAt = this.sourceStart;
                this.element.name = this.ts.lowerVar;
                jName = this.ts._var;
                this.ts.readToken();
            }
            else {
                this.nameShouldNotStartsWith$();
            }
        }
        else {
            this.expectName();
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.NUM) {
                this.ts.expectToken(Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        this.element.ui = this.parseUI();
        this.element.setJName(jName);
        this.parseParam();
    }

    protected parseBody() {
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
    protected parseSubItem(): BizBudValue {
        this.ts.assertToken(Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        let ui = this.parseUI();
        let bizBud = this.parseBud(name, ui);
        return bizBud;
    }

    protected isValidPropName(prop: string): boolean {
        if (invalidPropNames[prop] === true) {
            this.ts.error(`${names.join(',')} can not be used as Prop name`);
            return false;
        }
        return true;
    }

    protected parseBud(name: string, ui: Partial<UI>): BizBudValue {
        const keyColl: { [key: string]: new (biz: Biz, name: string, ui: Partial<UI>) => BizBudValue } = {
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
        const tokens = [Token.EQU, Token.COLONEQU, Token.COLON, Token.SEMICOLON, Token.COMMA, Token.RPARENTHESE];
        const { token } = this.ts;
        if (tokens.includes(token) === true) {
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
        let bizBud = new Bud(this.element.biz, name, ui);
        if (this.ts.isKeyword('required') === true) {
            bizBud.ui.required = true;
            this.ts.readToken();
        }
        bizBud.parser(this.context).parse();
        if (this.element.hasProp(name) === true) {
            this.ts.error(`${name} can not be used multiple times`);
        }

        const options: { [option: string]: boolean } = {};
        for (; ;) {
            if (this.ts.isKeyword(undefined) === false) break;
            let { lowerVar: option } = this.ts;
            if (options[option] === true) {
                this.ts.error(`${option} can define once`);
            }
            let parse = this.parseOptions[option];
            if (parse === undefined) break;
            parse(bizBud);
            options[option] = true;
        }
        if (bizBud.setType === undefined) {
            bizBud.setType = SetType.assign;
        }
        return bizBud;
    }

    protected parseOptions: { [option: string]: (bizBud: BizBudValue) => void } = {
        history: (bizBud: BizBudValue) => {
            bizBud.hasHistory = true;
            this.ts.readToken();
        },
        index: (bizBud: BizBudValue) => {
            bizBud.flag |= BudIndex.index;
            this.ts.readToken();
        },
        format: (bizBud: BizBudValue) => {
            this.ts.readToken();
            this.ts.mayPassToken(Token.EQU);
            let format = this.ts.passString();
            // bizBud.format = format;
            bizBud.ui.format = format;
        },
        set: (bizBud: BizBudValue) => {
            this.ts.readToken();
            this.ts.mayPassToken(Token.EQU);
            let setTypeText = this.ts.passKey();
            let setType: SetType;
            switch (setTypeText) {
                default: this.ts.expect('assign', 'cumulate', 'balance'); break;
                case 'assign':
                case '赋值':
                    setType = SetType.assign; break;
                case 'cumulate':
                case '累加':
                    setType = SetType.cumulate; break;
                case 'balance':
                case '结余':
                    setType = SetType.balance; break;
            }
            bizBud.setType = setType;
        }
    }
    abstract scan(space: BizEntitySpace): boolean;

    bizEntityScan2(bizEntity: BizEntity): boolean {
        return true;
    }
}

const names = ['i', 'x', 'value', 'price', 'amount', 'si', 'sx'];
const invalidPropNames: { [key: string]: boolean } = (function () {
    let ret = {};
    for (let v of names) {
        ret[v] = true;
    }
    return ret;
})();

export abstract class PBizEntity<B extends BizEntity> extends PBizBase<B> {
    protected saveSource() {
        const { type } = this.element;
        let entityType = type.toUpperCase();
        let source = this.getSource();
        this.element.source = entityType + ' ' + this.getNameInSource() + ' ' + source;
    }

    protected getNameInSource() {
        return this.element.getJName();
    }

    protected abstract get keyColl(): { [key: string]: () => void };
    protected parseContent(): void {
        const keyColl = this.keyColl;
        const keys = Object.keys(keyColl);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }

    protected parseProp = () => {
        let name: string;
        let ui: Partial<UI>;
        if (this.ts.token === Token.ADD) {
            this.ts.readToken();
            name = '+';
            ui = this.parseUI();
        }
        else if (this.ts.token === Token.VAR) {
            name = this.ts.passVar();
            ui = this.parseUI();
        }
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            let budGroup: BudGroup;
            if (name === undefined) {
                budGroup = this.element.group0;
            }
            else if (name === '+') {
                budGroup = this.element.group1;
            }
            else {
                budGroup = this.element.budGroups.get(name);
                if (budGroup === undefined) {
                    budGroup = new BudGroup(this.element.biz, name);
                    budGroup.ui = ui;
                    this.element.budGroups.set(name, budGroup);
                }
            }
            for (; ;) {
                let bud = this.parseSubItem();
                this.ts.passToken(Token.SEMICOLON);
                this.element.props.set(bud.name, bud);
                budGroup.buds.push(bud);
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    this.ts.mayPassToken(Token.SEMICOLON);
                    break;
                }
            }
        }
        else {
            if (name === undefined) {
                this.ts.expectToken(Token.LBRACE);
            }
            let bizBud = this.parseBud(name, ui);
            this.element.group0.buds.push(bizBud);
            this.ts.passToken(Token.SEMICOLON);
            this.element.props.set(bizBud.name, bizBud);
        }
    }

    private parsePermitOne(permissionLetters: string) {
        let role: string;
        let permission: Permission = {} as any;
        // , a: boolean, n: boolean, c: boolean, r: boolean, u: boolean, d: boolean, l: boolean;
        switch (this.ts.token) {
            default: this.ts.expectToken(Token.VAR, Token.MUL, Token.SUB); break;
            case Token.MUL:
                role = '*'; this.ts.readToken();
                break;
            case Token.VAR:
                role = this.ts.lowerVar; this.ts.readToken();
                break;
        }
        if (this.ts.token === Token.VAR && this.ts.varBrace === false) {
            let letters = this.ts.lowerVar;
            this.ts.readToken();
            for (let i = 0; i < letters.length; i++) {
                let c = letters.charAt(i);
                if (permissionLetters.includes(c) === true) {
                    permission[c] = true;
                }
                else {
                    this.ts.error(`${c} is a valid permission letter`);
                }
            }
        }
        else {
            permission.a = true;
        }

        this.element.permissions[role] = permission;
    }

    protected parseBudAtom(itemName: string) {
        let ui = this.parseUI();
        let bud = new BizBudAtom(this.element.biz, itemName, ui);
        if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
        }
        this.context.parseElement(bud);
        // this.parseBudEqu(bud);
        this.ts.passToken(Token.SEMICOLON);
        return bud;
    }

    protected parsePermission(permissionLetters: string) {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                this.parsePermitOne(permissionLetters);
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.RBRACE as any) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.parsePermitOne(permissionLetters);
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    protected parseIxField(ixField: IxField) {
        ixField.caption = this.ts.mayPassString();
        ixField.atoms = this.parseAtoms() as any;
    }

    private parseAtoms() {
        if (this.ts.isKeyword('me') === true) {
            this.ts.readToken();
            this.ts.passToken(Token.SEMICOLON);
            return undefined;
        }
        let ret: string[] = [this.ts.passVar()];
        for (; ;) {
            if (this.ts.token !== Token.BITWISEOR as any) break;
            this.ts.readToken();
            ret.push(this.ts.passVar());
        }
        this.ts.passToken(Token.SEMICOLON);
        return ret;
    }

    protected scanPermission(space: Space) {
        let ok = true;
        let { permissions } = this.element;
        for (let i in permissions) {
            if (i === '*') continue;
            let entity = space.getBizEntity(i);
            if (entity === undefined || entity.type !== 'role') {
                this.log(`${i} is not a ROLE`);
                ok = false;
            }
        }
        return ok;
    }

    protected scanBud(space: Space, bud: BizBudValue): boolean {
        let ok = true;
        let { pelement, name, value } = bud;
        if (this.element.budGroups.has(name) === true) {
            this.log(`Prop name ${name} duplicates with Group name`);
            ok = false;
        }
        if (pelement === undefined) {
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
            return ok;
        }
        if (pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }

    private scanBuds(space: Space, buds: Map<string, BizBudValue>) {
        let ok = true;
        for (let [, value] of buds) {
            if (this.scanBud(space, value) === false) ok = false;
        }
        return ok;
    }

    protected scanIxField(space: Space, tieField: IxField) {
        let ok = true;
        let atoms: BizAtomID[] = [];
        let atomNames = tieField.atoms as unknown as string[];
        if (atomNames === undefined) {
            if (tieField.caption !== undefined) {
                this.log(`TIE ME field should not define caption`);
                ok = false;
            }
            return ok;
        }

        for (let name of atomNames) {
            let bizEntity = space.getBizEntity(name);
            let { bizPhraseType } = bizEntity;
            if (bizPhraseType === BizPhraseType.atom || bizPhraseType === BizPhraseType.spec) {
                atoms.push(bizEntity as BizAtomID);
            }
            else {
                this.log(`${name} is neither ATOM nor SPEC`);
                ok = false;
            }
        }
        tieField.atoms = atoms;
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { props } = this.element;
        if (this.scanBuds(space, props) === false) ok = false;
        if (this.scanPermission(space) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.bizEntityScan2(this.element) === false) ok = false;
        return ok;
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = true;
        let { props, biz } = bizEntity;
        for (let [, value] of props) {
            let { pelement } = value;
            if (pelement === undefined) continue;
            if ((pelement as PBizBudValue<any>).bizEntityScan2(bizEntity) === false) ok = false;
        }
        return ok;
    }
}
