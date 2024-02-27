"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizIOSite = exports.PIOAppOut = exports.PIOAppIn = exports.PIOPeerArr = exports.PIOPeerOptions = exports.PIOPeerID = exports.PIOPeerScalar = exports.PIOAppOptions = exports.PIOAppID = exports.PBizIOApp = exports.inPreDefined = exports.PBizInActStatements = exports.PBizInAct = exports.PBizOut = exports.PBizIn = void 0;
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
    scan2(uq) {
        let ok = super.scan2(uq);
        this.element.setIOAppOuts();
        return ok;
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
const inSite = '$insite';
class BizInActSpace extends Biz_1.BizEntitySpace {
    _varPointer(name, isField) {
        if (this.bizEntity.props.has(name) === true) {
            return new il_1.VarPointer(name);
        }
        if (name === inSite) {
            return new il_1.VarPointer(inSite);
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
        this.parseConnect = () => {
            this.ts.passToken(tokens_1.Token.LBRACE);
            this.ts.passKey('type');
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let type = this.ts.lowerVar;
            let connects = Object.keys(il_1.IOConnectType);
            if (connects.includes(type) === false) {
                this.ts.error(`Connect type must be one of ${connects.join(',')}`);
            }
            this.element.connect.type = il_1.IOConnectType[type];
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            this.ts.passToken(tokens_1.Token.RBRACE);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
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
            connect: this.parseConnect,
            id: this.parseID,
            in: this.parseIn,
            out: this.parseOut,
        };
    }
    scan0(space) {
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
        let ioApp = this.element;
        for (let entity of space.uq.biz.bizArr) {
            if (entity.bizPhraseType !== il_1.BizPhraseType.ioSite)
                continue;
            let { ioApps } = entity;
            if (ioApps.find(v => v === ioApp) !== undefined) {
                ioApp.ioSites.push(entity);
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
class PIOAppOptions extends Base_1.PBizBase {
    _parse() {
    }
    scan(space) {
        let ok = true;
        return true;
    }
}
exports.PIOAppOptions = PIOAppOptions;
class PIOPeerScalar extends element_1.PElement {
    _parse() {
        this.ts.passToken(tokens_1.Token.COMMA);
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PIOPeerScalar = PIOPeerScalar;
class PIOPeerID extends element_1.PElement {
    _parse() {
        this.ioId = this.ts.mayPassVar();
        this.ts.passToken(tokens_1.Token.COMMA);
    }
    scan(space) {
        let ok = true;
        if (this.ioId !== undefined) {
            let id = this.element.id = this.element.ioAppIO.ioApp.IDs.find(v => v.name === this.ioId);
            if (id === undefined) {
                ok = false;
                this.log(`${this.ioId} is not IOApp ID`);
            }
        }
        return ok;
    }
}
exports.PIOPeerID = PIOPeerID;
class PIOPeerOptions extends element_1.PElement {
    _parse() {
        this.ioOptions = this.ts.mayPassVar();
        this.ts.passToken(tokens_1.Token.COMMA);
    }
    scan(space) {
        let ok = true;
        if (this.ioOptions !== undefined) {
            let options = this.element.options = space.getBizEntity(this.ioOptions);
            if (options === undefined) {
                ok = false;
                this.log(`${this.ioOptions} is not OPTIONS`);
            }
        }
        return ok;
    }
}
exports.PIOPeerOptions = PIOPeerOptions;
function parsePeers(context, ioAppIO, parentPeer, ts) {
    let peers = {};
    if (ts.token === tokens_1.Token.RPARENTHESE) {
        ts.readToken();
        ts.mayPassToken(tokens_1.Token.COMMA);
        return peers;
    }
    for (;;) {
        let peer = parsePeer();
        peers[peer.name] = peer;
        if (ts.token === tokens_1.Token.RPARENTHESE) {
            ts.readToken();
            ts.mayPassToken(tokens_1.Token.COMMA);
            break;
        }
    }
    function parsePeer() {
        let peer;
        let name = ts.passVar();
        let to;
        if (ts.token === tokens_1.Token.COLON) {
            ts.readToken();
            to = ts.passVar();
        }
        if (ts.token === tokens_1.Token.LPARENTHESE) {
            peer = new il_1.IOPeerArr(ioAppIO, parentPeer);
        }
        else {
            if (ts.isKeyword('id') === true) {
                ts.readToken();
                peer = new il_1.IOPeerID(ioAppIO, parentPeer);
            }
            else if (ts.isKeyword('options') === true) {
                ts.readToken();
                peer = new il_1.IOPeerOptions(ioAppIO, parentPeer);
            }
            else {
                peer = new il_1.IOPeerScalar(ioAppIO, parentPeer);
            }
        }
        context.parseElement(peer);
        peer.name = name;
        peer.to = to;
        return peer;
    }
    return peers;
}
function checkPeers(space, pElement, props, peers) {
    let ok = true;
    for (let i in peers) {
        let peer = peers[i];
        if (peer.pelement.scan(space) === false) {
            ok = false;
        }
        const { name } = peer;
        let log;
        if (props.has(name) === false) {
            ok = false;
            log = `${name} is not defined`;
        }
        else {
            let bud = props.get(name);
            if (peer.peerType === il_1.PeerType.peerId) {
                if (bud.dataType !== il_1.BudDataType.ID) {
                    ok = false;
                    log = `${name} should not be ID`;
                }
            }
            else {
                if (bud.dataType === il_1.BudDataType.ID) {
                    ok = false;
                    log = `${name} should be ID`;
                }
            }
        }
        if (log !== undefined)
            pElement.log(log);
    }
    for (let [, bud] of props) {
        if (bud.dataType === il_1.BudDataType.ID) {
            let peer = peers[bud.name];
            if (peer === undefined) {
                ok = false;
                pElement.log(`${bud.name} must define ID`);
            }
            else if (peer.peerType !== il_1.PeerType.peerId) {
                ok = false;
                pElement.log(`${peer.name} must be ID`);
            }
        }
    }
    return ok;
}
class PIOPeerArr extends element_1.PElement {
    _parse() {
        this.ts.readToken();
        const { ioAppIO, parentPeer } = this.element;
        const peers = parsePeers(this.context, ioAppIO, parentPeer, this.ts);
        Object.assign(this.element.peers, peers);
    }
    scan(space) {
        let ok = true;
        const { name, peers, ioAppIO, parentPeer } = this.element;
        let peerNames = [];
        for (let p = parentPeer; p != undefined; p = parentPeer.parentPeer)
            peerNames.push(p.name);
        peerNames.push(name);
        peerNames.reverse();
        const { bizIO } = ioAppIO;
        let pProps = bizIO.props;
        for (let p of peerNames) {
            let bud = pProps.get(p);
            pProps = bud.props;
        }
        if (checkPeers(space, this, pProps, peers) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PIOPeerArr = PIOPeerArr;
class PIOAppIO extends Base_1.PBizBase {
    _parse() {
        this.element.name = this.ts.passVar();
        this.parseTo();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            const peers = parsePeers(this.context, this.element, undefined, this.ts);
            Object.assign(this.element.peers, peers);
        }
        this.parseConfig();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseTo() {
    }
    parseConfig() {
    }
    scan0(space) {
        let ok = true;
        const { name } = this.element;
        let bizEntity = space.getBizEntity(name);
        let bizPhraseType = this.entityBizPhraseType;
        if (bizEntity === undefined || bizEntity.bizPhraseType !== bizPhraseType) {
            ok = false;
            this.log(`${name} is not ${il_1.BizPhraseType[bizPhraseType].toUpperCase()}`);
        }
        else {
            this.element.bizIO = bizEntity;
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { peers, bizIO } = this.element;
        if (bizIO !== undefined) {
            if (checkPeers(space, this, bizIO.props, peers) === false) {
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
    parseTo() {
        if (this.ts.token === tokens_1.Token.COLON) {
            this.ts.readToken();
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.VAR, tokens_1.Token.STRING);
                    break;
                case tokens_1.Token.STRING:
                    this.element.to = this.ts.text;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.VAR:
                    this.element.to = this.ts.lowerVar;
                    this.ts.readToken();
                    break;
            }
        }
    }
    parseConfig() {
        if (this.ts.token !== tokens_1.Token.LBRACE)
            return;
        this.ts.readToken();
        this.ts.passToken(tokens_1.Token.RBRACE);
    }
}
exports.PIOAppOut = PIOAppOut;
class PBizIOSite extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.apps = new Set();
        this.parseTieAtom = () => {
            this.tie = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseApp = () => {
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                for (;;) {
                    this.apps.add(this.ts.passVar());
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        continue;
                    }
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                        break;
                    }
                }
            }
            else {
                this.apps.add(this.ts.passVar());
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            }
        };
        this.keyColl = {
            tie: this.parseTieAtom,
            ioapp: this.parseApp,
        };
    }
    scan0(space) {
        let ok = super.scan0(space);
        if (this.tie === undefined) {
            ok = false;
            this.log(`IOSite must define TIE atom`);
        }
        else {
            let atom = space.getBizEntity(this.tie);
            if (atom === undefined || atom.bizPhraseType !== il_1.BizPhraseType.atom) {
                ok = false;
                this.log(`IOSite TIE ${this.tie} must be ATOM`);
            }
            else {
                this.element.tie = atom;
            }
        }
        const { ioApps } = this.element;
        for (let app of this.apps) {
            let ioApp = space.getBizEntity(app);
            if (ioApp === undefined || ioApp.bizPhraseType !== il_1.BizPhraseType.ioApp) {
                ok = false;
                this.log(`${app} is not IOApp`);
            }
            else {
                ioApps.push(ioApp);
            }
        }
        return ok;
    }
    scan(space) {
        let ok = super.scan(space);
        return ok;
    }
}
exports.PBizIOSite = PBizIOSite;
//# sourceMappingURL=InOut.js.map