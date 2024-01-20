import { DbContext, BBizEntity, BBizIn, BBizOut, BBizIOApp } from "../../builder";
import { PBizIOApp, PBizIn, PBizInAct, PBizOut, PContext, PElement, PIOAppID, PIOAppIn, PIOAppOut, PIOPeerArr, PIOPeerID, PIOPeerScalar } from "../../parser";
import { IElement } from "../IElement";
import { EnumDataType } from "../datatype";
import { BizAct, BizBase } from "./Base";
import { Biz } from "./Biz";
import { BizAtom } from "./BizID";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export abstract class BizInOut extends BizEntity {
    protected readonly fields = [];
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

    parser(context: PContext): PElement<IElement> {
        return new PBizOut(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizOut(dbContext, this);
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
    readonly bizPhraseType = BizPhraseType.bud;
    readonly dataType = BudDataType.none;
    readonly atoms: BizAtom[] = [];
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppID(this, context);
    }
    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.atoms = this.atoms.map(v => v.id);
        return ret;
    }
}

export abstract class IOPeer extends IElement {
    type = 'iopeer';
    name: string;
}
export class IOPeerScalar extends IOPeer {
    to: string;
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerScalar(this, context);
    }
}
export class IOPeerID extends IOPeerScalar {
    readonly ioApp: BizIOApp;
    idName: string;
    id: IOAppID;
    constructor(ioApp: BizIOApp) {
        super();
        this.ioApp = ioApp;
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerID(this, context);
    }
}
export class IOPeerArr extends IOPeer {
    readonly ioApp: BizIOApp;
    readonly peers: IOPeer[] = [];
    constructor(ioApp: BizIOApp) {
        super();
        this.ioApp = ioApp;
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIOPeerArr(this, context);
    }
}

export abstract class IOAppIO extends BizBud {
    readonly bizPhraseType = BizPhraseType.bud;
    readonly dataType = BudDataType.none;
    readonly peers: IOPeer[] = [];
    readonly ioApp: BizIOApp;
    constructor(ioApp: BizIOApp) {
        super(ioApp.biz, undefined, {});
        this.ioApp = ioApp;
    }
}

export class IOAppIn extends IOAppIO {
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppIn(this, context);
    }
}

export class IOAppOut extends IOAppIO {
    override parser(context: PContext): PElement<IElement> {
        return new PIOAppOut(this, context);
    }
}

export class BizIOApp extends BizEntity {
    readonly bizPhraseType = BizPhraseType.ioApp;
    readonly fields = [];
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
}
