import { BizAtom, BizAtomState, BizSpec } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizSpec extends PBizEntity<BizSpec> {
    protected get defaultName(): string { return undefined; }

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            key: this.parseKey,
            assign: this.parseAssign,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    protected parseKey = () => {
        let key = this.parseSubItem('key');
        this.element.keys.set(key.name, key);
    }

    protected isValidPropName(prop: string): boolean {
        return true;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        let { keys } = this.element;
        let { size } = keys;
        if (size > 4) {
            this.log(`Spec '${this.element.name}' defined ${size} keys. Can not have more than 4 keys`);
            ok = false;
        }
        this.element.buildFields();
        return ok;
    }
}

export class PBizAtom extends PBizEntity<BizAtom> {
    protected get defaultName(): string { return undefined; }

    private baseIDName: string;
    private specName: string;

    protected parseParam(): void {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.baseIDName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }

    protected parseContent(): void {
        const keyColl = {
            uom: this.parseUom,
            spec: this.parseSpec,
            prop: this.parseProp,
            assign: this.parseAssign,
            state: this.parseState,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    private parseUom = () => {
        if (this.element.uom !== undefined) {
            this.ts.error('UOM can only be defined once');
        }
        /*
        let metric: string;
        if (this.ts.token === Token.VAR) {
            metric = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            metric = '*';
        }
        */
        this.element.uom = true;
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseState = () => {
        let state = this.context.parse(BizAtomState);
        this.element.states.set(state.name, state);
    }

    private parseSpec = () => {
        if (this.specName !== undefined) {
            this.ts.error('SPEC can only be defined once');
        }
        this.ts.assertToken(Token.VAR);
        this.specName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.baseIDName !== undefined) {
            let atom = this.scanAtom(space, this.baseIDName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.base = atom;
            }
        }
        if (this.specName !== undefined) {
            let spec = this.scanSpec(space, this.specName);
            if (spec === undefined) {
                ok = false;
            }
            else {
                this.element.spec = spec;
            }
        }
        this.element.setUom();
        /*
        let { uom: metric } = this.element;
        if (metric !== undefined) {
            if (metric !== '*') {
                let enm = space.getEnum('metrictype');
                if (enm === undefined) {
                    this.log('Enum MetricType is not defined');
                    ok = false;
                }
                else {
                    let { keyValues } = enm;
                    let value = keyValues[metric];
                    if (value === undefined) {
                        this.log(`Enum MetricType has not '${metric}'`);
                        ok = false;
                    }
                }
            }
        }
        */
        return ok;
    }
}

export class PBizAtomState extends PBizBase<BizAtomState> {
    protected get defaultName(): string {
        return undefined;
    }
}
