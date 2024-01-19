import {
    BizBudValue, BizIn, BizInOut, BizOut, Statements
    , Statement, BizInAct, BizStatementIn, BizInActStatements
    , Pointer, BizEntity, VarPointer, Biz, UI
    , budClassesOut, budClassKeysOut, budClassesIn, budClassKeysIn, BudDataType, BizBudArr, BizIOApp, IOAppID, IOAppIn, IOAppOut, BizAtom, BizPhraseType, IOAppIO, IOPeerID, IOPeer, IOPeerScalar, IOPeerArr, BizBud
} from "../../il";
import { PElement } from "../element";
import { PContext } from "../pContext";
import { Space } from "../space";
import { Token, TokenStream } from "../tokens";
import { PBizAct, PBizActStatements, PBizBase, PBizEntity } from "./Base";
import { BizEntitySpace } from "./Biz";

abstract class PBizInOut<T extends BizInOut> extends PBizEntity<T> {
    readonly keyColl = {};

    protected override parseParam(): void {
        const { props } = this.element;
        let propArr = this.parsePropArr();
        this.parsePropMap(props, propArr);
        /*
        for (; this.ts.isKeyword('arr') === true;) {
            this.ts.readToken();
            let name = this.ts.passVar();
            propArr = this.parsePropArr();
            let map = new Map<string, BizBudValue>();
            this.parsePropMap(map, propArr);
            arrs[name] = {
                name,
                props: map,
                arrs: undefined,
            }
        }
        */
    }

    protected override parseBody(): void {
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        const { props } = this.element;
        const nameColl: { [name: string]: boolean } = {};
        if (this.checkBudDuplicate(nameColl, props) === false) {
            ok = false;
        }
        return ok;
    }

    private checkBudDuplicate(nameColl: { [name: string]: boolean }, props: Map<string, BizBud>): boolean {
        let ok = true;
        for (let [, bud] of props) {
            let { name, dataType } = bud;
            if (nameColl[name] === true) {
                this.log(`'${name}' duplicate prop name`);
                ok = false;
            }
            else {
                nameColl[name] = true;
            }
            if (dataType === BudDataType.arr) {
                if (this.checkBudDuplicate(nameColl, (bud as BizBudArr).props) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}

export class PBizIn extends PBizInOut<BizIn> {
    protected override getBudClass(budClass: string): new (biz: Biz, name: string, ui: Partial<UI>) => BizBudValue {
        return budClassesIn[budClass];
    }
    protected override getBudClassKeys() {
        return budClassKeysIn;
    }
    protected override parseBody(): void {
        if (this.ts.token !== Token.LBRACE) {
            this.ts.expectToken(Token.LBRACE);
        }
        let bizAct = new BizInAct(this.element.biz, this.element);
        this.context.parseElement(bizAct);
        this.element.act = bizAct;
    }
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { act } = this.element;
        if (act.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

export class PBizOut extends PBizInOut<BizOut> {
    protected override getBudClass(budClass: string): new (biz: Biz, name: string, ui: Partial<UI>) => BizBudValue {
        return budClassesOut[budClass];
    }
    protected override getBudClassKeys() {
        return budClassKeysOut;
    }
    protected override parseBody(): void {
        this.ts.passToken(Token.SEMICOLON);
    }
}

export class PBizInAct extends PBizAct<BizInAct> {
    protected override createBizActStatements(): Statements {
        return new BizInActStatements(undefined, this.element);
    }

    protected override createBizActSpace(space: Space): Space {
        return new BizInActSpace(space, this.element.bizIn);
    }
}

export class PBizInActStatements extends PBizActStatements<BizInAct> {
    protected override createBizActStatement(parent: Statement): Statement {
        return new BizStatementIn(parent, this.bizAct);
    }
}

export const inPreDefined = [
];

class BizInActSpace extends BizEntitySpace<BizIn> {
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (inPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        return undefined;
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }
}

export class PBizIOApp extends PBizEntity<BizIOApp> {
    private parseID = () => {
        let name = this.ts.passVar();
        let ui = this.parseUI();
        const id = new IOAppID(this.element.biz, name, ui);
        this.context.parseElement(id);
        this.element.IDs.push(id);
    }

    private parseIn = () => {
        const ioAppIn = new IOAppIn(this.element);
        this.context.parseElement(ioAppIn);
        this.element.ins.push(ioAppIn);
    }

    private parseOut = () => {
        const ioAppOut = new IOAppOut(this.element);
        this.context.parseElement(ioAppOut);
        this.element.outs.push(ioAppOut);
    }

    protected readonly keyColl = {
        id: this.parseID,
        in: this.parseIn,
        out: this.parseOut,
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { props, IDs, ins, outs } = this.element;
        for (let item of [...IDs, ...ins, ...outs]) {
            if (item.pelement.scan(space) === false) {
                ok = false;
            }
            else {
                props.set(item.name, item);
            }
        }
        return ok;
    }
}

export class PIOAppID extends PBizBase<IOAppID> {
    private atomNames: string[] = [];
    protected override _parse(): void {
        this.ts.passKey('to');
        for (; ;) {
            this.atomNames.push(this.ts.passVar());
            if (this.ts.token !== Token.BITWISEOR) break;
            this.ts.readToken();
        }
        this.ts.passToken(Token.SEMICOLON);
    }
    override scan(space: Space): boolean {
        let ok = true;
        for (let atomName of this.atomNames) {
            const bizAtom = space.getBizEntity<BizAtom>(atomName);
            if (bizAtom === undefined || bizAtom.bizPhraseType !== BizPhraseType.atom) {
                ok = false;
                this.log(`${atomName} is not an ATOM`);
            }
            this.element.atoms.push(bizAtom);
        }
        return ok;
    }
}

export class PIOPeerScalar extends PElement<IOPeerScalar> {
    protected override _parse(): void {
        this.ts.passToken(Token.SEMICOLON);
    }
    override scan(space: Space): boolean {
        let ok = true;
        return ok;
    }
}

export class PIOPeerID extends PElement<IOPeerID> {
    private ioId: string;
    protected override _parse(): void {
        this.ioId = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }
    override scan(space: Space): boolean {
        let ok = true;
        let id = this.element.id = this.element.ioApp.IDs.find(v => v.name === this.ioId);
        if (id === undefined) {
            ok = false;
            this.log(`${this.ioId} is not IOApp ID`);
        }
        return ok;
    }
}

function parsePeers(context: PContext, ioApp: BizIOApp, ts: TokenStream): IOPeer[] {
    let peers: IOPeer[] = [];
    if (ts.token === Token.RBRACE) {
        ts.readToken();
        ts.mayPassToken(Token.SEMICOLON);
        return peers;
    }
    for (; ;) {
        let peer = parsePeer();
        peers.push(peer);
        if (ts.token === Token.RBRACE as any) {
            ts.readToken();
            ts.mayPassToken(Token.SEMICOLON);
            break;
        }
    }
    function parsePeer() {
        let peer: IOPeer;
        let name = ts.passVar();
        ts.passToken(Token.COLON);
        if (ts.token === Token.LBRACE) {
            peer = new IOPeerArr(ioApp);
        }
        else {
            let peerScalar: IOPeerScalar;
            let to = ts.passVar();
            if (ts.isKeyword('id') === true) {
                ts.readToken();
                peerScalar = new IOPeerID(ioApp);
            }
            else {
                peerScalar = new IOPeerScalar();
            }
            peerScalar.to = to;
            peer = peerScalar;
        }
        context.parseElement(peer);
        peer.name = name;
        return peer;
    }
    return peers;
}

export class PIOPeerArr extends PElement<IOPeerArr> {
    protected override _parse(): void {
        this.ts.readToken();
        const peers = parsePeers(this.context, this.element.ioApp, this.ts);
        this.element.peers.push(...peers);
    }
    override scan(space: Space): boolean {
        let ok = true;
        const { peers } = this.element;
        for (let peer of peers) {
            if (peer.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

abstract class PIOAppIO<T extends IOAppIO> extends PBizBase<T> {
    protected override _parse(): void {
        this.element.name = this.ts.passVar();
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            const peers = parsePeers(this.context, this.element.ioApp, this.ts);
            this.element.peers.push(...peers);
        } else {
            this.ts.passToken(Token.SEMICOLON);
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { name, peers } = this.element;
        let bizEntity = space.getBizEntity(name);
        let bizPhraseType = this.entityBizPhraseType;
        if (bizEntity === undefined || bizEntity.bizPhraseType !== bizPhraseType) {
            ok = false;
            this.log(`${name} is not ${BizPhraseType[bizPhraseType].toUpperCase()}`)
        }
        for (let peer of peers) {
            if (peer.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    protected abstract get entityBizPhraseType(): BizPhraseType;
}

export class PIOAppIn extends PIOAppIO<IOAppIn> {
    protected get entityBizPhraseType(): BizPhraseType {
        return BizPhraseType.in;
    }
}

export class PIOAppOut extends PIOAppIO<IOAppOut> {
    protected get entityBizPhraseType(): BizPhraseType {
        return BizPhraseType.out;
    }
}