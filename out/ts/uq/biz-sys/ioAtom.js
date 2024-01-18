"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = `
ATOM $IOOuter {
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

ATOM $IOApp {
}

DUO $IOOuterApp {
    I $IOOuter;
    X $IOApp;
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

DUO $IOAppInOut {
    I $IOApp;
    X $BizPhrase;
}
`;
//# sourceMappingURL=ioAtom.js.map