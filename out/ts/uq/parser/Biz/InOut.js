"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIOAppOut = exports.PIOAppIn = exports.PIOPeerArr = exports.PIOPeerID = exports.PIOPeerScalar = exports.PIOAppID = exports.PBizIOApp = exports.inPreDefined = exports.PBizInActStatements = exports.PBizInAct = exports.PBizOut = exports.PBizIn = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Biz_1 = require("./Biz");
class PBizInOut extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    parseParam() {
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
    parseBody() {
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        const { props } = this.element;
        const nameColl = {};
        if (this.checkBudDuplicate(nameColl, props) === false) {
            ok = false;
        }
        return ok;
    }
    checkBudDuplicate(nameColl, props) {
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
            if (dataType === il_1.BudDataType.arr) {
                if (this.checkBudDuplicate(nameColl, bud.props) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}
class PBizIn extends PBizInOut {
    getBudClass(budClass) {
        return il_1.budClassesIn[budClass];
    }
    getBudClassKeys() {
        return il_1.budClassKeysIn;
    }
    parseBody() {
        if (this.ts.token !== tokens_1.Token.LBRACE) {
            this.ts.expectToken(tokens_1.Token.LBRACE);
        }
        let bizAct = new il_1.BizInAct(this.element.biz, this.element);
        this.context.parseElement(bizAct);
        this.element.act = bizAct;
    }
    scan(space) {
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
exports.PBizIn = PBizIn;
class PBizOut extends PBizInOut {
    getBudClass(budClass) {
        return il_1.budClassesOut[budClass];
    }
    getBudClassKeys() {
        return il_1.budClassKeysOut;
    }
    parseBody() {
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
}
exports.PBizOut = PBizOut;
class PBizInAct extends Base_1.PBizAct {
    createBizActStatements() {
        return new il_1.BizInActStatements(undefined, this.element);
    }
    createBizActSpace(space) {
        return new BizInActSpace(space, this.element.bizIn);
    }
}
exports.PBizInAct = PBizInAct;
class PBizInActStatements extends Base_1.PBizActStatements {
    createBizActStatement(parent) {
        return new il_1.BizStatementIn(parent, this.bizAct);
    }
}
exports.PBizInActStatements = PBizInActStatements;
exports.inPreDefined = [];
class BizInActSpace extends Biz_1.BizEntitySpace {
    _varPointer(name, isField) {
        if (exports.inPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
    }
    _varsPointer(names) {
        return undefined;
    }
    _getBizEntity(name) {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }
}
class PBizIOApp extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseID = () => {
            let name = this.ts.passVar();
            let ui = this.parseUI();
            const id = new il_1.IOAppID(this.element.biz, name, ui);
            this.context.parseElement(id);
            this.element.IDs.push(id);
        };
        this.parseIn = () => {
            const ioAppIn = new il_1.IOAppIn(this.element);
            this.context.parseElement(ioAppIn);
            this.element.ins.push(ioAppIn);
        };
        this.parseOut = () => {
            const ioAppOut = new il_1.IOAppOut(this.element);
            this.context.parseElement(ioAppOut);
            this.element.outs.push(ioAppOut);
        };
        this.keyColl = {
            id: this.parseID,
            in: this.parseIn,
            out: this.parseOut,
        };
    }
    scan(space) {
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
exports.PBizIOApp = PBizIOApp;
class PIOAppID extends Base_1.PBizBase {
    constructor() {
        super(...arguments);
        this.atomNames = [];
    }
    _parse() {
        this.ts.passKey('to');
        for (;;) {
            this.atomNames.push(this.ts.passVar());
            if (this.ts.token !== tokens_1.Token.BITWISEOR)
                break;
            this.ts.readToken();
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        for (let atomName of this.atomNames) {
            const bizAtom = space.getBizEntity(atomName);
            if (bizAtom === undefined || bizAtom.bizPhraseType !== il_1.BizPhraseType.atom) {
                ok = false;
                this.log(`${atomName} is not an ATOM`);
            }
            this.element.atoms.push(bizAtom);
        }
        return ok;
    }
}
exports.PIOAppID = PIOAppID;
class PIOPeerScalar extends element_1.PElement {
    _parse() {
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PIOPeerScalar = PIOPeerScalar;
class PIOPeerID extends element_1.PElement {
    _parse() {
        this.ioId = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        let id = this.element.id = this.element.ioApp.IDs.find(v => v.name === this.ioId);
        if (id === undefined) {
            ok = false;
            this.log(`${this.ioId} is not IOApp ID`);
        }
        return ok;
    }
}
exports.PIOPeerID = PIOPeerID;
function parsePeers(context, ioApp, ts) {
    let peers = [];
    if (ts.token === tokens_1.Token.RBRACE) {
        ts.readToken();
        ts.mayPassToken(tokens_1.Token.SEMICOLON);
        return peers;
    }
    for (;;) {
        let peer = parsePeer();
        peers.push(peer);
        if (ts.token === tokens_1.Token.RBRACE) {
            ts.readToken();
            ts.mayPassToken(tokens_1.Token.SEMICOLON);
            break;
        }
    }
    function parsePeer() {
        let peer;
        let name = ts.passVar();
        ts.passToken(tokens_1.Token.COLON);
        if (ts.token === tokens_1.Token.LBRACE) {
            peer = new il_1.IOPeerArr(ioApp);
        }
        else {
            let peerScalar;
            let to = ts.passVar();
            if (ts.isKeyword('id') === true) {
                ts.readToken();
                peerScalar = new il_1.IOPeerID(ioApp);
            }
            else {
                peerScalar = new il_1.IOPeerScalar();
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
class PIOPeerArr extends element_1.PElement {
    _parse() {
        this.ts.readToken();
        const peers = parsePeers(this.context, this.element.ioApp, this.ts);
        this.element.peers.push(...peers);
    }
    scan(space) {
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
exports.PIOPeerArr = PIOPeerArr;
class PIOAppIO extends Base_1.PBizBase {
    _parse() {
        this.element.name = this.ts.passVar();
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            const peers = parsePeers(this.context, this.element.ioApp, this.ts);
            this.element.peers.push(...peers);
        }
        else {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
        let ok = true;
        const { name, peers } = this.element;
        let bizEntity = space.getBizEntity(name);
        let bizPhraseType = this.entityBizPhraseType;
        if (bizEntity === undefined || bizEntity.bizPhraseType !== bizPhraseType) {
            ok = false;
            this.log(`${name} is not ${il_1.BizPhraseType[bizPhraseType].toUpperCase()}`);
        }
        for (let peer of peers) {
            if (peer.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
class PIOAppIn extends PIOAppIO {
    get entityBizPhraseType() {
        return il_1.BizPhraseType.in;
    }
}
exports.PIOAppIn = PIOAppIn;
class PIOAppOut extends PIOAppIO {
    get entityBizPhraseType() {
        return il_1.BizPhraseType.out;
    }
}
exports.PIOAppOut = PIOAppOut;
//# sourceMappingURL=InOut.js.map