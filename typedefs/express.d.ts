import {Server} from "http";
import {ListenOptions} from "net";
import events from "events";

export declare namespace express {
    interface DecoratedRouter extends Function {
        stack?: Layer[],
        _scribe: {handlers: {}},
    }

    interface Layer {
        handle: DecoratedRouter
        name: 'router' | 'bound dispatch' | '<anonymous>' | string // Name of the middleware function
        params?: any;
        path?: string;
        keys: [];
        regexp: PathRegExp,
        method: string;
        route?: Route,
    }

    interface PathRegExp extends RegExp {
        fast_star?: boolean
        fast_slash?: boolean
    }

    interface Route {
        methods: string[]
        path: string
        stack: Layer[]
    }

    type PathArgument = string | RegExp | (string | RegExp)[]

    interface NextFunction {
        (err?: any): void;
    }

    interface RequestHandler {
        (req: Request, res: Response, next: NextFunction): any;
    }

    interface ErrorHandler {
        (err: any, req: Request, res: Response, next: NextFunction): any;
    }

    type Handler = RequestHandler | ErrorHandler;

    /** Can be passed to all methods like `use`, `get`, `all` etc */
    type HandlerArgument = Handler | Handler[];

    interface Application extends events.EventEmitter {
        // See https://github.com/types/express/blob/master/lib/application.d.ts
        mountpath: string | string[];
        locals: any;
        init(): void;
        defaultConfiguration(): void;
        engine(ext: string, fn: Function): Application;
        set(setting: string, val: any): this;
        get(name: string): any;
        // need to duplicate this here from the Router because of the overload
        get(path: PathArgument, ...handlers: HandlerArgument[]): this;

        /**
         * Add callback triggers to route parameters, where name is the name of the parameter or an array of them,
         * and callback is the callback function. The parameters of the callback function are the request object,
         * the response object, the next middleware, the value of the parameter and the name of the parameter,
         * in that order.
         * If name is an array, the callback trigger is registered for each parameter declared in it,
         * in the order in which they are declared. Furthermore, for each declared parameter except the last one,
         * a call to next inside the callback will call the callback for the next declared parameter.
         * For the last parameter, a call to next will call the next middleware in place for the route currently
         * being processed, just like it would if name were just a string.
         * For example, when :user is present in a route path, you may map user loading logic to automatically
         * provide req.user to the route, or perform validations on the parameter input.
         */
        param(name: string | string[], handler: (req: Request, res: Response, next: NextFunction, value: any, name: string) => any): this;
        path(): string;
        enabled(setting: string): boolean;
        disabled(setting: string): boolean;
        enable(setting: string): this;
        disable(setting: string): this;
        render(name: string, locals?: { [local: string]: any }, callback?: (err: Error, html: string) => void): void;
        render(name: string, callback: (err: Error, html: string) => void): void;
        listen(port: number, hostname?: string, backlog?: number, listeningListener?: Function): Server;
        listen(port: number, hostname?: string, listeningListener?: Function): Server;
        listen(port: number, backlog?: number, listeningListener?: Function): Server;
        listen(port: number, listeningListener?: Function): Server;
        listen(path: string, backlog?: number, listeningListener?: Function): Server;
        listen(path: string, listeningListener?: Function): Server;
        listen(handle: any, backlog?: number, listeningListener?: Function): Server;
        listen(handle: any, listeningListener?: Function): Server;
        listen(options: ListenOptions, listeningListener?: Function): Server;
    }
}