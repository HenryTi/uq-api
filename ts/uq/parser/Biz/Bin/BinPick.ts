import { binFieldArr } from "../../../consts";
import {
    BizPhraseType, BizPend, BinPick, PickBase, PickAtom
    , BizAtom, PickSpec, BizSpec, PickPend, PickQuery, BizQueryTable
} from "../../../il";
import { PElement } from "../../element";
import { Space } from "../../space";
import { Token } from "../../tokens";

export class PBinPick extends PElement<BinPick> {
    private from: string[] = [];
    protected _parse(): void {
        this.ts.passKey('from');
        for (; ;) {
            this.from.push(this.ts.passVar());
            if (this.ts.token !== Token.BITWISEOR) break;
            this.ts.readToken();
        }
        if (this.ts.token === Token.LBRACE as any) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('param') === true) {
                    this.ts.readToken();
                    let name = this.ts.passVar();
                    this.ts.passToken(Token.EQU);
                    let bud: string;
                    if (this.ts.token === Token.MOD as any) {
                        this.ts.readToken();
                        bud = '%' + this.ts.passVar();
                    }
                    else {
                        bud = this.ts.passVar();
                    }
                    let prop: string;
                    if (this.ts.token === Token.DOT as any) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push({
                        name,
                        bud,
                        prop,
                    });
                }
                else {
                    this.ts.expect('param');
                }
                this.ts.passToken(Token.SEMICOLON);
            }
        }
        if (this.ts.isKeyword('single') === true) {
            this.element.single = true;
            this.ts.readToken();
        }
        if (this.ts.prevToken !== Token.RBRACE) {
            this.ts.passToken(Token.SEMICOLON);
        }
        else {
            this.ts.mayPassToken(Token.SEMICOLON);
        }
    }

    scan0(space: Space): boolean {
        if (this.element.pick !== undefined) return true;
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizPhraseType, }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase: PickBase;
            let multipleEntity = false;
            const bizEntity0 = entityArr[0];
            switch (bizPhraseType) {
                default:
                    this.log(`Can only pick from ATOM, SPEC, Pend, or Query`);
                    ok = false;
                    break;
                case BizPhraseType.atom:
                    pickBase = new PickAtom(entityArr as BizAtom[]);
                    multipleEntity = true;
                    break;
                case BizPhraseType.spec:
                    pickBase = new PickSpec(bizEntity0 as BizSpec);
                    break;
                case BizPhraseType.pend:
                    pickBase = new PickPend(bizEntity0 as BizPend);
                    break;
                case BizPhraseType.query:
                    pickBase = new PickQuery(bizEntity0 as BizQueryTable);
                    break;
            }
            this.element.pick = pickBase;
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        const { logs, ok: retOk }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let { params, bin, pick: pickBase } = this.element;
            if (params !== undefined) {
                for (let p of params) {
                    const { name, bud, prop } = p;
                    if (pickBase.hasParam(name) === false) {
                        this.log(`PARAM ${name} is not defined`);
                        ok = false;
                    }
                    if (bud === '%sheet') {
                        const sheetProps = binFieldArr;
                        if (prop === undefined || sheetProps.includes(prop) === true) {
                        }
                        else {
                            this.log(`%sheet. can be one of${sheetProps.join(',')}`);
                            ok = false;
                        }
                    }
                    else {
                        let pick = bin.pickColl[bud];
                        if (pick === undefined) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${bud} is not defined`);
                            ok = false;
                        }
                        else {
                            let { pick: pickBase } = pick;
                            if (pickBase !== undefined && pickBase.hasReturn(prop) === false) {
                                this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${prop} is not defined`);
                                ok = false;
                            }
                        }
                    }
                }
            }
        }
        return ok;
    }
}
