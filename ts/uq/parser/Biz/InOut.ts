import {
    BizBudValue, BizIn, BizInOut, BizOut, Statements
    , Statement, BizInAct, BizStatementIn, BizInActStatements
    , Pointer, BizEntity, VarPointer, Biz, UI
    , budClassesOut, budClassKeysOut, budClassesIn, budClassKeysIn, BudDataType, BizBudArr, BizIOApp
    , IOAppID, IOAppIn, IOAppOut, BizAtom, BizPhraseType, IOAppIO
    , IOPeerID, IOPeer, IOPeerScalar, IOPeerArr, BizBud, PeerType, Uq, BizIOSite
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

    override scan2(uq: Uq): boolean {
        let ok = super.scan2(uq);
        this.element.setIOAppOuts();
        return ok;
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
        if (this.bizEntity.props.has(name) === true) {
            return new VarPointer(name);
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

    override scan0(space: Space): boolean {
        let ok = true;
        const { props, IDs, ins, outs } = this.element;
        for (let item of [...IDs, ...ins, ...outs]) {
            if (item.pelement.scan0(space) === false) {
                ok = false;
            }
            else {
                props.set(item.name, item);
            }
        }
        return ok;
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
        let ioApp = this.element;
        for (let entity of space.uq.biz.bizArr) {
            if (entity.bizPhraseType !== BizPhraseType.ioSite) continue;
            let { ioApps } = entity as BizIOSite;
            if (ioApps.find(v => v === ioApp) !== undefined) {
                ioApp.ioSites.push(entity as BizIOSite);
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
        let id = this.element.id = this.element.ioAppIO.ioApp.IDs.find(v => v.name === this.ioId);
        if (id === undefined) {
            ok = false;
            this.log(`${this.ioId} is not IOApp ID`);
        }
        return ok;
    }
}

function parsePeers(context: PContext, ioAppIO: IOAppIO, parentPeer: IOPeerArr, ts: TokenStream): { [name: string]: IOPeer; } {
    let peers: { [name: string]: IOPeer; } = {};
    if (ts.token === Token.RBRACE) {
        ts.readToken();
        ts.mayPassToken(Token.SEMICOLON);
        return peers;
    }
    for (; ;) {
        let peer = parsePeer();
        peers[peer.name] = peer;
        if (ts.token === Token.RBRACE as any) {
            ts.readToken();
            ts.mayPassToken(Token.SEMICOLON);
            break;
        }
    }
    function parsePeer() {
        let peer: IOPeer;
        let name = ts.passVar();
        let to: string;
        if (ts.token === Token.COLON) {
            ts.readToken();
            to = ts.passVar();
        }
        if (ts.token === Token.LBRACE) {
            peer = new IOPeerArr(ioAppIO, parentPeer);
        }
        else {
            if (ts.isKeyword('id') === true) {
                ts.readToken();
                peer = new IOPeerID(ioAppIO, parentPeer);
            }
            else {
                peer = new IOPeerScalar(ioAppIO, parentPeer);
            }
        }
        context.parseElement(peer);
        peer.name = name;
        peer.to = to;
        return peer;
    }
    return peers;
}

function checkPeers(space: Space, pElement: PElement, props: Map<string, BizBud>, peers: { [name: string]: IOPeer; }) {
    let ok = true;
    for (let i in peers) {
        let peer = peers[i];
        if (peer.pelement.scan(space) === false) {
            ok = false;
        }
        const { name } = peer;
        let log: string;
        if (props.has(name) === false) {
            ok = false;
            log = `${name} is not defined`;
        }
        else {
            let bud = props.get(name);
            if (peer.peerType === PeerType.peerId) {
                if (bud.dataType !== BudDataType.ID) {
                    ok = false;
                    log = `${name} should not be ID`;
                }
            }
            else {
                if (bud.dataType === BudDataType.ID) {
                    ok = false;
                    log = `${name} should be ID`;
                }
            }
        }
        if (log !== undefined) pElement.log(log);
    }
    for (let [, bud] of props) {
        if (bud.dataType === BudDataType.ID) {
            let peer = peers[bud.name];
            if (peer === undefined) {
                ok = false;
                pElement.log(`${bud.name} must define ID`);
            }
            else if (peer.peerType !== PeerType.peerId) {
                ok = false;
                pElement.log(`${peer.name} must be ID`);
            }
        }
    }
    return ok;
}

export class PIOPeerArr extends PElement<IOPeerArr> {
    protected override _parse(): void {
        this.ts.readToken();
        const { ioAppIO, parentPeer } = this.element;
        const peers = parsePeers(this.context, ioAppIO, parentPeer, this.ts);
        Object.assign(this.element.peers, peers);
    }
    override scan(space: Space): boolean {
        let ok = true;
        const { name, peers, ioAppIO, parentPeer } = this.element;
        let peerNames: string[] = [];
        for (let p = parentPeer; p != undefined; p = parentPeer.parentPeer) peerNames.push(p.name);
        peerNames.push(name);
        peerNames.reverse();
        const { bizIO } = ioAppIO;
        let pProps = bizIO.props;
        for (let p of peerNames) {
            let bud = pProps.get(p) as BizBudArr;
            pProps = bud.props;
        }
        if (checkPeers(space, this, pProps, peers) === false) {
            ok = false;
        }
        return ok;
    }
}

abstract class PIOAppIO<T extends IOAppIO> extends PBizBase<T> {
    protected override _parse(): void {
        this.element.name = this.ts.passVar();
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            const peers = parsePeers(this.context, this.element, undefined, this.ts);
            Object.assign(this.element.peers, peers);
        } else {
            this.ts.passToken(Token.SEMICOLON);
        }
    }

    override scan0(space: Space): boolean {
        let ok = true;
        const { name } = this.element;
        let bizEntity = space.getBizEntity<BizInOut>(name);
        let bizPhraseType = this.entityBizPhraseType;
        if (bizEntity === undefined || bizEntity.bizPhraseType !== bizPhraseType) {
            ok = false;
            this.log(`${name} is not ${BizPhraseType[bizPhraseType].toUpperCase()}`)
        }
        else {
            this.element.bizIO = bizEntity;
        }
        return ok;
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { peers, bizIO } = this.element;
        if (bizIO !== undefined) {
            if (checkPeers(space, this, bizIO.props, peers) === false) {
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

export class PBizIOSite extends PBizEntity<BizIOSite> {
    private tie: string;
    private readonly apps: Set<string> = new Set();

    private parseTieAtom = () => {
        this.tie = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseApp = () => {
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                this.apps.add(this.ts.passVar());
                this.ts.passToken(Token.SEMICOLON);
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    this.ts.mayPassToken(Token.SEMICOLON);
                    break;
                }
            }
        }
        else {
            this.apps.add(this.ts.passVar());
            this.ts.passToken(Token.SEMICOLON);
        }
    }

    protected readonly keyColl = {
        tie: this.parseTieAtom,
        ioapp: this.parseApp,
    }

    override scan0(space: Space): boolean {
        let ok = super.scan0(space);
        if (this.tie === undefined) {
            ok = false;
            this.log(`IOSite must define TIE atom`);
        }
        else {
            let atom = space.getBizEntity<BizAtom>(this.tie);
            if (atom === undefined || atom.bizPhraseType !== BizPhraseType.atom) {
                ok = false;
                this.log(`IOSite TIE ${this.tie} must be ATOM`);
            }
            else {
                this.element.tie = atom;
            }
        }
        const { ioApps } = this.element;
        for (let app of this.apps) {
            let ioApp = space.getBizEntity<BizIOApp>(app);
            if (ioApp === undefined || ioApp.bizPhraseType !== BizPhraseType.ioApp) {
                ok = false;
                this.log(`${app} is not IOApp`);
            }
            else {
                ioApps.push(ioApp);
            }
        }
        return ok;
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        return ok;
    }
}
