import { DbContext, BBizEntity, BBizIn, BBizOut, BBizIOApp } from "../../builder";
import {
    PBizIOApp, PBizIOSite, PBizIn, PBizInAct, PBizOut, PContext, PElement
    , PIOAppID, PIOAppIn, PIOAppOptions, PIOAppOut, PIOPeerArr, PIOPeerID, PIOPeerOptions, PIOPeerScalar, PIOPeers
} from "../../parser";
import { IElement } from "../IElement";
import { UI } from "../UI";
import { BizAct } from "./Base";
import { Biz } from "./Biz";
import { IDUnique, BizAtom } from "./BizID";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud } from "./Bud";
import { BizEntity, BizNotID } from "./Entity";
import { BizOptions } from "./Options";

// ???
// 2024-01-26
// 隐藏问题：同一个对象atom，属于不同的IOSite，但是IOSite下的App可能指向同一个服务器
// 有可能同一份数据在这个app中出现两份。
// 以后再解决。可能的办法是，这份数据有ID，然后在同一个App服务器去重复。
// ???

export abstract class BizInOut extends BizNotID {
}

export class BizIn extends BizInOut {
    readonly bizPhraseType = BizPhraseType.in;
    act: BizInAct;

    parser(context: PContext): PElement<IElement> {
        return new PBizIn(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizIn(dbContext, this);
    }
}

export class BizOut extends BizInOut {
    readonly bizPhraseType = BizPhraseType.out;
    ioAppOuts: IOAppOut[];

    parser(context: PContext): PElement<IElement> {
        return new PBizOut(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizOut(dbContext, this);
    }

    setIOAppOuts() {
        this.ioAppOuts = this.biz.getIOAppOuts(this)
    }
}

export class BizInAct extends BizAct {
    readonly bizIn: BizIn;
    constructor(biz: Biz, bizIn: BizIn) {
        super(biz);
        this.bizIn = bizIn;
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizInAct(this, context);
    }
}

export class IOAppID extends BizBud {
    readonly dataType = BudDataType.any;
    readonly bizAtoms: BizAtom[] = [];
    unique: IDUnique;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new IOAppID(entity, name, ui);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppID(this, context);
    }
    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.atoms = this.bizAtoms.map(v => v.id);
        return ret;
    }
}

export class IOAppOptions extends BizBud {
    readonly dataType = BudDataType.any;
    options: BizOptions;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new IOAppOptions(entity, name, ui);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppOptions(this, context);
    }
    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.options = this.options?.id;
        return ret;
    }
}

export enum PeerType { peerScalar, peerId, peerOptions, peerArr };
export abstract class IOPeer extends IElement {
    readonly type: undefined;
    name: string;
    to: string;
    readonly owner: IOPeers;
    abstract get peerType(): PeerType;
    constructor(owner: IOPeers) {
        super();
        this.owner = owner;
    }
}
export class IOPeerScalar extends IOPeer {
    readonly peerType = PeerType.peerScalar;

    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerScalar(this, context);
    }
}

export interface PeerIDKey {
    bud: BizBud;
    peer: IOPeer;
    sameLevel: boolean;         // same level or parent level
}
export class IOPeerID extends IOPeer {
    readonly peerType = PeerType.peerId;
    id: IOAppID;
    keys: PeerIDKey[];
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerID(this, context);
    }
}
export class IOPeerOptions extends IOPeer {
    readonly peerType = PeerType.peerOptions;
    options: BizOptions;
    isValue: boolean = false;
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerOptions(this, context);
    }
}
export class IOPeerArr extends IOPeer {
    readonly peerType = PeerType.peerArr;
    peers: IOPeers;
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerArr(this, context);
    }
}

export interface PeersContainer {
    name: string;
    owner: PeersContainer;
    peers: { [name: string]: IOPeer };
}

export class IOPeers extends IElement {
    readonly type = 'iopeers';
    owner: IOPeers;
    readonly ioAppIO: IOAppIO;
    readonly peers: { [name: string]: IOPeer } = {};
    bizIOBuds: Map<string, BizBud>;
    constructor(ioAppIO: IOAppIO) {
        super();
        this.ioAppIO = ioAppIO;
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeers(this, context);
    }
}

export abstract class IOAppIO extends BizBud {
    readonly dataType = BudDataType.any;
    readonly ioApp: BizIOApp;
    peers: IOPeers;
    bizIO: BizInOut;
    constructor(ioApp: BizIOApp) {
        super(ioApp, undefined, {});
        this.ioApp = ioApp;
    }
}

export class IOAppIn extends IOAppIO {
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new IOAppIn(this.ioApp);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppIn(this, context);
    }
}

export class IOAppOut extends IOAppIO {
    to: string;     // peer act name
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new IOAppOut(this.ioApp);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppOut(this, context);
    }
}

export enum IOConnectType {
    connect1 = 1,
    connect2 = 2,
}
interface IOAppConnect {
    type: IOConnectType;
}
export class BizIOApp extends BizNotID {
    readonly bizPhraseType = BizPhraseType.ioApp;
    readonly connect: IOAppConnect = { type: undefined, };
    readonly ioSites: BizIOSite[] = [];
    readonly IDs: IOAppID[] = [];
    readonly ins: IOAppIn[] = [];
    readonly outs: IOAppOut[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizIOApp(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizIOApp(dbContext, this);
    }

    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.IDs = this.IDs.map(v => v.buildSchema(res));
        ret.ins = this.ins.map(v => v.buildSchema(res));
        ret.outs = this.outs.map(v => v.buildSchema(res));
        ret.props = undefined;
        return ret;
    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }

    forEachBud(callback: (bud: BizBud) => void): void {
        super.forEachBud(callback);
        for (let ID of this.IDs) callback(ID);
        for (let ioIn of this.ins) callback(ioIn);
        for (let ioOut of this.outs) callback(ioOut);
    }
}

export class BizIOSite extends BizNotID {
    readonly bizPhraseType = BizPhraseType.ioSite;
    tie: BizAtom;
    readonly ioApps: BizIOApp[] = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizIOSite(this, context);
    }
    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.tie = this.tie.id;
        ret.apps = this.ioApps.map(v => v.id);
        return ret;
    }
}

export class UseOut {
    readonly out: BizOut;
    to: boolean;
    constructor(out: BizOut, to: boolean) {
        this.out = out;
        this.to = to;
    }
    get varName(): string {
        return `${this.out.id}`;
    }
}