export default `
ATOM $IOOuter {
}

ATOM $IOApp {
}

DUO $IOOuterApp {
    I $IOOuter;
    X $IOApp;
}

DUO $IOAppInOut {
    I $IOApp;
    X $BizPhrase;
}
`;
