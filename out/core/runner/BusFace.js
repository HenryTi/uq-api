"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusFaceQuery = exports.BusFaceAccept = exports.BusFace = exports.allBuses = void 0;
const centerApi_1 = require("../centerApi");
;
;
exports.allBuses = {};
class BusFace {
    constructor(entityRunner, url, bus, faceName, version) {
        this.entityRunner = entityRunner;
        this.bus = bus;
        let parts = url.split('/');
        this.busOwner = parts[0];
        this.busName = parts[1];
        this.busUrl = `${parts[0]}/${parts[1]}`;
        this.faceName = faceName;
        this.version = version;
    }
    convert(busBody, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return busBody;
        });
    }
    getFaceSchema(version) {
        return __awaiter(this, void 0, void 0, function* () {
            let bus;
            let busAllVersions = exports.allBuses[this.busUrl];
            if (busAllVersions) {
                bus = busAllVersions[version];
            }
            else {
                busAllVersions = {};
                exports.allBuses[this.busUrl] = busAllVersions;
            }
            if (!bus) {
                let schemaText = yield centerApi_1.centerApi.busSchema(this.busOwner, this.busName, version);
                bus = this.buildBus(schemaText);
                busAllVersions[version] = bus;
            }
            return bus[this.faceName];
        });
    }
    buildBus(schemaText) {
        let bus = {};
        let schemas = JSON.parse(schemaText);
        for (let i in schemas) {
            bus[i.toLowerCase()] = {
                _: [{ name: '$', type: 'array' }],
                $: [],
            };
        }
        for (let i in schemas) {
            let schema = schemas[i];
            let face = bus[i.toLowerCase()];
            this.buildFace(bus, face, schema);
        }
        return bus;
    }
    buildFace(bus, face, schema) {
        let { _, $ } = face;
        for (let field of schema) {
            let { type } = field;
            switch (type) {
                case 'array':
                    let { name, fields } = field;
                    _.push(field);
                    face[name] = bus[fields.toLowerCase()].$;
                    break;
                default:
                    $.push(field);
                    break;
            }
        }
    }
}
exports.BusFace = BusFace;
class BusFaceAccept extends BusFace {
    constructor(entityRunner, url, bus, faceName, version, accept) {
        super(entityRunner, url, bus, faceName, version);
        this.accept = accept;
    }
    convert(busBody, version) {
        return __awaiter(this, void 0, void 0, function* () {
            let face = yield this.getFaceSchema(version);
            let body = this.parseBusBody(busBody, face);
            let faceThisVersion = yield this.getFaceSchema(this.version);
            let busText = this.buildBusBody(body, faceThisVersion);
            return busText;
        });
    }
    parseBusBody(busBody, face) {
        let ret = [];
        let p = 0, bodyLen = busBody.length;
        function parseRow(fields) {
            let ret = {};
            let len = fields.length - 1;
            for (let i = 0; i < len; i++) {
                let { name } = fields[i];
                let tPos = busBody.indexOf('\t', p);
                if (tPos < 0) {
                    throw new Error('not \\t in parseRow in parseBusBody');
                }
                ret[name] = busBody.substring(p, tPos);
                p = tPos + 1;
            }
            let nPos = busBody.indexOf('\n', p);
            if (nPos < 0) {
                throw new Error('not \\n in parseRow in parseBusBody');
            }
            ret[fields[len].name] = busBody.substring(p, nPos);
            p = nPos + 1;
            return ret;
        }
        function parseArr(fields) {
            let ret = [];
            for (; p < bodyLen;) {
                ret.push(parseRow(fields));
                if (busBody.charCodeAt(p) === 10) {
                    ++p;
                    break;
                }
            }
            return ret;
        }
        function parseArrs() {
            let ret = {};
            let { _ } = face;
            let len = _.length;
            for (let i = 1; i < len; i++) {
                let { name } = _[i];
                let fields = face[name];
                ret[name] = parseArr(fields);
            }
            return ret;
        }
        for (; p < bodyLen;) {
            let $ = parseRow(face.$);
            let arrs = parseArrs();
            ret.push({ $, arrs });
        }
        return ret;
    }
    buildBusBody(content, face) {
        let ret = '';
        for (let bc of content) {
            ret += this.buildRow(bc.$, face.$) + '\n';
            let { _ } = face;
            let len = _.length;
            for (let i = 1; i < len; i++) {
                let { name } = _[i];
                ret += this.buildArr(bc.arrs[name], face[name]) + '\n';
            }
        }
        return ret;
    }
    buildRow(c, fields) {
        let ret = '';
        let sep = '';
        for (let f of fields) {
            let { name } = f;
            let v = c[name];
            ret += sep + (v !== null && v !== void 0 ? v : '');
            sep = '\t';
        }
        return ret;
    }
    buildArr(arr, fields) {
        let ret = '';
        for (let row of arr) {
            ret += this.buildRow(row, fields) + '\n';
        }
        return ret;
    }
}
exports.BusFaceAccept = BusFaceAccept;
class BusFaceQuery extends BusFace {
    constructor(entityRunner, url, bus, faceName, version) {
        super(entityRunner, url, bus, faceName, version);
        this.query = true;
    }
}
exports.BusFaceQuery = BusFaceQuery;
//# sourceMappingURL=BusFace.js.map