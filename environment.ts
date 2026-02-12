import { ClassExpr, FuncDecl } from "./ast.ts";
import { RuntimeVal, ValueType } from "./values.ts";
import { Function } from "./function.ts";
import { reportError } from "./main.ts";
import { setupEnv } from "./globals.ts";
import { Callable } from "./callable.ts";

function setupScope(env: Environment) {
    setupEnv(env);
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string,RuntimeVal>;
    public functions: Map<string,Function>;
    private classes: Map<string,ClassExpr>;

    private identifiers: Map<string,Callable>;

    constructor (parentENV?: Environment) {
        const global = parentENV==undefined ? true : false;
        this.parent=parentENV;
        this.variables = new Map();
        this.functions = new Map();
        this.classes = new Map();
        if (global) {
            setupScope(this);
        }
    }
    
    public declareVar(varname: string, value: RuntimeVal,type: ValueType):RuntimeVal {
        if (this.variables.has(varname)) {
            throw `Variável ${varname} já declarada`;
        }
        value.type=type;
        this.variables.set(varname,value);
        return value;
    }

    public assignVar(varname:string,value:RuntimeVal):RuntimeVal {
        const env = this.resolve(varname);
        env.variables.set(varname,value);
        return value;
    }

    public resolve(varname:string): Environment {
        if (this.variables.has(varname)) {
            return this
        }
        if (this.parent==undefined) {
            throw `Variável ${varname} não existe`;
        }
        return this.parent.resolve(varname);
    }

    public lookupVar(varname:string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolveFunc(funcname:string): Environment {
        if (this.functions.has(funcname)) {
            return this;
        }
        if (this.parent==undefined) {
            throw `Função ${funcname} não existe`;
        }
        return this.parent.resolveFunc(funcname);
    }

    public hasFunc(funcname:string): boolean {
        if (this.functions.has(funcname)) {
            return true;
        }
        if (this.parent==undefined) {
            throw `Função ${funcname} não existe`;
        }
        return this.parent.hasFunc(funcname);
    }

    public lookupFunc(funcname:string): Function {
        const env = this.resolveFunc(funcname);
        return env.functions.get(funcname) as Function;
    }

    public hasVar(varname:string): boolean {
        if (this.variables.has(varname)) {
            return true
        }
        if (this.parent==undefined) {
            return false
        }
        return this.parent.hasVar(varname);
    }


    public declareFunc(func:FuncDecl) {
        const identifier = func.identifier;
        if (this.functions.has(identifier)) {throw reportError("Função "+identifier+" já declarada",func.line);}
        
        const args = func.args;
        const type = func.type;
        const functionBody = func.body;
        
        const fun = new Function(functionBody,args,type);

        this.functions.set(identifier,fun);

        return func
    }

    public declareClass(classDecl:ClassExpr) {
        const identifier = classDecl.identifier;
        if (this.classes.has(identifier)) {throw "Classe "+identifier+" já declarada";}
        this.classes.set(identifier,classDecl);
        return classDecl;
    }

    public resolveClass(classname:string): ClassExpr {
        if (this.classes.has(classname)) {
            return this.classes.get(classname) as ClassExpr;
        }
        if (this.parent==undefined) {
            throw `Classe ${classname} não existe`;
        }
        return this.parent.resolveClass(classname);
    }
}