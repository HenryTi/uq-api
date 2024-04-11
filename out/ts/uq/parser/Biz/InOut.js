"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizIOSite = exports.PIOAppOut = exports.PIOAppIn = exports.PIOPeers = exports.PIOPeerArr = exports.PIOPeerOptions = exports.PIOPeerID = exports.PIOPeerScalar = exports.PIOAppOptions = exports.PIOAppID = exports.PBizIOApp = exports.inPreDefined = exports.PBizInActStatements = exports.PBizInAct = exports.PBizOut = exports.PBizIn = void 0;
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
            const id = new il_1.IOAppID(this.element, name, ui);
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
    scan2(uq) {
        let ok = true;
        const { IDs, ins, outs } = this.element;
        for (let item of [...IDs, ...ins, ...outs]) {
            if (item.pelement.scan2(uq) === false) {
                ok = false;
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
        if (this.ts.isKeyword('unique') === true) {
            this.ts.readToken();
            this.unique = this.ts.passVar();
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        const { atoms } = this.element;
        for (let atomName of this.atomNames) {
            const bizAtom = space.getBizEntity(atomName);
            if (bizAtom === undefined || bizAtom.bizPhraseType !== il_1.BizPhraseType.atom) {
                ok = false;
                this.log(`${atomName} is not an ATOM`);
            }
            atoms.push(bizAtom);
        }
        if (this.unique !== undefined) {
            let un = this.unique;
            let uniques = atoms.map(v => v.getUnique(un));
            let u0 = uniques[0];
            if (u0 === undefined) {
                ok = false;
                this.log(`${atoms[0].name} has not defined UNIQUE ${un}`);
                let r = atoms.map(v => v.getUnique(un));
            }
            else {
                let unique0 = uniques[0];
                let atom0 = atoms[0];
                for (let i = 1; i < uniques.length; i++) {
                    let atom = atoms[i];
                    let u = atom.getUnique(un);
                    if (u !== unique0) {
                        ok = false;
                        this.log(`${atom.getJName()} does not match ${atom0.getJName()} UNIQUE ${un}`);
                    }
                }
                this.element.unique = unique0;
            }
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
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.keys = [];
            for (;;) {
                this.keys.push(this.ts.passVar());
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
        }
        this.ts.passToken(tokens_1.Token.COMMA);
    }
    scan(space) {
        let ok = true;
        const { owner: { ioAppIO } } = this.element;
        const { IDs } = ioAppIO.ioApp;
        if (this.ioId !== undefined) {
            let id = this.element.id = IDs.find(v => v.name === this.ioId);
            if (id === undefined) {
                ok = false;
                this.log(`${this.ioId} is not IOApp ID`);
            }
            if (this.keys !== undefined) {
                const { unique } = id;
                if (unique === undefined) {
                    ok = false;
                    this.log(`${id.name} does not define unique`);
                }
                else {
                    if (this.keys.length !== unique.keys.length) {
                        ok = false;
                        this.log(`keys count is not match with UNIQUE ${unique.name}`);
                    }
                    else if (this.scanKeys() === false) {
                        ok = false;
                    }
                }
            }
        }
        return ok;
    }
    scanKeys() {
        let ok = true;
        const { owner: { bizIOBuds, peers, owner } } = this.element;
        this.element.keys = [];
        const { keys } = this.element;
        for (let k of this.keys) {
            let bud = bizIOBuds.get(k);
            let peer = peers[k];
            if (bud !== undefined) {
                keys.push({
                    bud,
                    peer,
                    sameLevel: true,
                });
                continue;
            }
            else if (owner !== undefined) {
                const { bizIOBuds: ownerBizIOBuds, peers: ownerPeers } = owner;
                bud = ownerBizIOBuds.get(k);
                peer = ownerPeers[k];
                if (bud !== undefined) {
                    keys.push({
                        bud,
                        peer,
                        sameLevel: false,
                    });
                    continue;
                }
            }
            ok = false;
            this.log(`${k} not exists`);
        }
        return ok;
    }
}
exports.PIOPeerID = PIOPeerID;
class PIOPeerOptions extends element_1.PElement {
    _parse() {
        this.ioOptions = this.ts.mayPassVar();
        if (this.ioOptions !== undefined) {
            if (this.ts.token === tokens_1.Token.DOT) {
                this.ts.readToken();
                this.ts.passKey('value');
                this.element.isValue = true;
            }
        }
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
class PIOPeerArr extends element_1.PElement {
    _parse() {
        this.element.peers = new il_1.IOPeers(this.element.owner.ioAppIO);
        const { peers } = this.element;
        peers.owner = this.element.owner;
        this.context.parseElement(peers);
    }
    scan0(space) {
        let ok = true;
        let { name, peers, owner: { ioAppIO } } = this.element;
        if (peers.pelement.scan0(space) === false) {
            ok = false;
        }
        let { bizIO } = ioAppIO;
        let bizBud = bizIO.props.get(name);
        if (bizBud === undefined) {
            this.log(`${bizIO.getJName()}.${name} not exists`);
            ok = false;
        }
        else if (bizBud.dataType !== il_1.BudDataType.arr) {
            this.log(`${bizIO.getJName()}.${name} is not Array`);
            ok = false;
        }
        else {
            peers.bizIOBuds = bizBud.props;
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { peers } = this.element;
        if (peers.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PIOPeerArr = PIOPeerArr;
class PIOPeers extends element_1.PElement {
    _parse() {
        let { peers } = this.element;
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            let peer = this.parsePeer();
            peers[peer.name] = peer;
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.COMMA);
                break;
            }
        }
    }
    parsePeer() {
        let peer;
        let name = this.ts.passVar();
        let to;
        if (this.ts.token === tokens_1.Token.COLON) {
            this.ts.readToken();
            to = this.ts.passVar();
        }
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            peer = new il_1.IOPeerArr(this.element);
        }
        else {
            if (this.ts.isKeyword('id') === true) {
                this.ts.readToken();
                peer = new il_1.IOPeerID(this.element);
            }
            else if (this.ts.isKeyword('options') === true) {
                this.ts.readToken();
                peer = new il_1.IOPeerOptions(this.element);
            }
            else {
                peer = new il_1.IOPeerScalar(this.element);
            }
        }
        this.context.parseElement(peer);
        peer.name = name;
        peer.to = to;
        return peer;
    }
    scan0(space) {
        let ok = true;
        let { peers } = this.element;
        for (let i in peers) {
            if (peers[i].pelement.scan0(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { ioAppIO, peers, bizIOBuds } = this.element;
        for (let i in peers) {
            let peer = peers[i];
            if (peer.pelement.scan(space) === false) {
                ok = false;
            }
            const { name } = peer;
            let log;
            let bud = bizIOBuds.get(name);
            if (bud === undefined) {
                ok = false;
                log = `${name} is not defined`;
            }
            else {
                if (peer.peerType === il_1.PeerType.peerId) {
                    if (bud.dataType !== il_1.BudDataType.ID) {
                        // ok = false;
                        log = `${name} should be ID`;
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
                this.log(log);
        }
        for (let [, bud] of bizIOBuds) {
            if (bud.dataType === il_1.BudDataType.ID) {
                let peer = peers[bud.name];
                if (peer === undefined) {
                    ok = false;
                    this.log(`${bud.name} must define ID in IOApp ${ioAppIO.ioApp.getJName()} ${ioAppIO.name}`);
                }
                else if (peer.peerType !== il_1.PeerType.peerId) {
                    ok = false;
                    this.log(`${peer.name} must be ID`);
                }
            }
        }
        return ok;
    }
}
exports.PIOPeers = PIOPeers;
class PIOAppIO extends Base_1.PBizBase {
    _parse() {
        this.element.name = this.ts.passVar();
        this.parseTo();
        //if (this.ts.token === Token.LPARENTHESE) {
        //this.ts.readToken();
        const peers = new il_1.IOPeers(this.element);
        this.element.peers = peers;
        // const peers = parsePeers(this.context, this.element, undefined, this.ts);
        // Object.assign(this.element.peers, peers);
        this.context.parseElement(peers);
        //}
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
            const { peers } = this.element;
            peers.bizIOBuds = bizEntity.props;
            if (peers.pelement.scan0(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { peers, bizIO } = this.element;
        if (bizIO !== undefined) {
            if (peers.pelement.scan(space) === false) {
                ok = false;
            }
            /*
            if (checkPeers(space, this, this.element, bizIO.props, peers) === false) {
                ok = false;
            }
            */
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