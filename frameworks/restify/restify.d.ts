export declare namespace restify {
    interface Server {
        name: 'restify',
        handleUncaughtExceptions: boolean,
        url: string,
        router: DecoratedRouter,
    }

    interface DecoratedRouter extends Router {
        _decoratedByScribe: true,
        _scribe: {handlers: {}}
    }

    interface Router {
        _registry: RouterRegistryRadix
    }

    interface RouterRegistryRadix {
        _routes: Record<string, Route>
    }

    interface Route {
        method: string
        path: string
        name: string
        spec: { path: string, version: string, method: string },
        chain: {},
    }

}