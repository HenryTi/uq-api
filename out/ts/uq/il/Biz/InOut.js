"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseOut = exports.BizIOSite = exports.BizIOApp = exports.IOConnectType = exports.IOAppOut = exports.IOAppIn = exports.IOAppIO = exports.IOPeers = exports.IOPeerArr = exports.IOPeerOptions = exports.IOPeerID = exports.IOPeerScalar = exports.IOPeer = exports.PeerType = exports.IOAppOptions = exports.IOAppID = exports.BizInAct = exports.BizOut = exports.BizIn = exports.BizInOut = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const IElement_1 = require("../IElement");
const Base_1 = require("./Base");
const BizPhraseType_1 = require("./BizPhraseType");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
// ???
// 2024-01-26
// 隐藏问题：同一个对象atom，属于不同的IOSite，但是IOSite下的App可能指向同一个服务器
// 有可能同一份数据在这个app中出现两份。
// 以后再解决。可能的办法是，这份数据有ID，然后在同一个App服务器去重复。
// ???
class BizInOut extends Entity_1.BizNotID {
}
exports.BizInOut = BizInOut;
class BizIn extends BizInOut {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.in;
    }
    parser(context) {
        return new parser_1.PBizIn(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizIn(dbContext, this);
    }
}
exports.BizIn = BizIn;
class BizOut extends BizInOut {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.out;
    }
    parser(context) {
        return new parser_1.PBizOut(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizOut(dbContext, this);
    }
    setIOAppOuts() {
        this.ioAppOuts = this.biz.getIOAppOuts(this);
    }
}
exports.BizOut = BizOut;
class BizInAct extends Base_1.BizAct {
    constructor(biz, bizIn) {
        super(biz);
        this.bizIn = bizIn;
    }
    parser(context) {
        return new parser_1.PBizInAct(this, context);
    }
}
exports.BizInAct = BizInAct;
class IOAppID extends Bud_1.BizBud {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.any;
        this.atoms = [];
    }
    clone(entity, name, ui) {
        return new IOAppID(entity, name, ui);
    }
    parser(context) {
        return new parser_1.PIOAppID(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.atoms = this.atoms.map(v => v.id);
        return ret;
    }
}
exports.IOAppID = IOAppID;
class IOAppOptions extends Bud_1.BizBud {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.any;
    }
    clone(entity, name, ui) {
        return new IOAppOptions(entity, name, ui);
    }
    parser(context) {
        return new parser_1.PIOAppOptions(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.options = (_a = this.options) === null || _a === void 0 ? void 0 : _a.id;
        return ret;
    }
}
exports.IOAppOptions = IOAppOptions;
var PeerType;
(function (PeerType) {
    PeerType[PeerType["peerScalar"] = 0] = "peerScalar";
    PeerType[PeerType["peerId"] = 1] = "peerId";
    PeerType[PeerType["peerOptions"] = 2] = "peerOptions";
    PeerType[PeerType["peerArr"] = 3] = "peerArr";
})(PeerType || (exports.PeerType = PeerType = {}));
;
class IOPeer extends IElement_1.IElement {
    constructor(owner) {
        super();
        this.owner = owner;
    }
}
exports.IOPeer = IOPeer;
class IOPeerScalar extends IOPeer {
    constructor() {
        super(...arguments);
        this.peerType = PeerType.peerScalar;
    }
    parser(context) {
        return new parser_1.PIOPeerScalar(this, context);
    }
}
exports.IOPeerScalar = IOPeerScalar;
class IOPeerID extends IOPeer {
    constructor() {
        super(...arguments);
        this.peerType = PeerType.peerId;
    }
    parser(context) {
        return new parser_1.PIOPeerID(this, context);
    }
}
exports.IOPeerID = IOPeerID;
class IOPeerOptions extends IOPeer {
    constructor() {
        super(...arguments);
        this.peerType = PeerType.peerOptions;
        this.isValue = false;
    }
    parser(context) {
        return new parser_1.PIOPeerOptions(this, context);
    }
}
exports.IOPeerOptions = IOPeerOptions;
class IOPeerArr extends IOPeer {
    constructor() {
        super(...arguments);
        this.peerType = PeerType.peerArr;
    }
    parser(context) {
        return new parser_1.PIOPeerArr(this, context);
    }
}
exports.IOPeerArr = IOPeerArr;
class IOPeers extends IElement_1.IElement {
    constructor(ioAppIO) {
        super();
        this.type = 'iopeers';
        this.peers = {};
        this.ioAppIO = ioAppIO;
    }
    parser(context) {
        return new parser_1.PIOPeers(this, context);
    }
}
exports.IOPeers = IOPeers;
class IOAppIO extends Bud_1.BizBud {
    constructor(ioApp) {
        super(ioApp, undefined, {});
        this.dataType = BizPhraseType_1.BudDataType.any;
        this.ioApp = ioApp;
    }
}
exports.IOAppIO = IOAppIO;
class IOAppIn extends IOAppIO {
    clone(entity, name, ui) {
        return new IOAppIn(this.ioApp);
    }
    parser(context) {
        return new parser_1.PIOAppIn(this, context);
    }
}
exports.IOAppIn = IOAppIn;
class IOAppOut extends IOAppIO {
    clone(entity, name, ui) {
        return new IOAppOut(this.ioApp);
    }
    parser(context) {
        return new parser_1.PIOAppOut(this, context);
    }
}
exports.IOAppOut = IOAppOut;
var IOConnectType;
(function (IOConnectType) {
    IOConnectType[IOConnectType["connect1"] = 1] = "connect1";
    IOConnectType[IOConnectType["connect2"] = 2] = "connect2";
})(IOConnectType || (exports.IOConnectType = IOConnectType = {}));
class BizIOApp extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.ioApp;
        this.connect = { type: undefined, };
        this.ioSites = [];
        this.IDs = [];
        this.ins = [];
        this.outs = [];
    }
    parser(context) {
        return new parser_1.PBizIOApp(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizIOApp(dbContext, this);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.IDs = this.IDs.map(v => v.buildSchema(res));
        ret.ins = this.ins.map(v => v.buildSchema(res));
        ret.outs = this.outs.map(v => v.buildSchema(res));
        ret.props = undefined;
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        for (let ID of this.IDs)
            callback(ID);
        for (let ioIn of this.ins)
            callback(ioIn);
        for (let ioOut of this.outs)
            callback(ioOut);
    }
}
exports.BizIOApp = BizIOApp;
class BizIOSite extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.ioSite;
        this.ioApps = [];
    }
    parser(context) {
        return new parser_1.PBizIOSite(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.tie = this.tie.id;
        ret.apps = this.ioApps.map(v => v.id);
        return ret;
    }
}
exports.BizIOSite = BizIOSite;
class UseOut {
    constructor(out, to) {
        this.out = out;
        this.to = to;
    }
    get varName() {
        return `${this.out.id}`;
    }
}
exports.UseOut = UseOut;
//# sourceMappingURL=InOut.js.map