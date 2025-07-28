import { Class, FuncDecl } from "./ast.ts";
import { BooleanVal, MK_NULL, RuntimeVal, ValueType } from "./values.ts";

function setupScope(env: Environment) {
    env.declareVar("verdadeiro",{type:"BooleanVal",value:true} as BooleanVal,"BooleanVal");
    env.declareVar("falso",{type:"BooleanVal",value:false} as BooleanVal,"BooleanVal");
    env.declareVar("nulo",MK_NULL(),"NullVal");
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string,RuntimeVal>;
    private functions: Map<string,FuncDecl>;
    private classes: Map<string,Class>;

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
            throw `Impossível resolver variável ${varname} pois ela não existe.`
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
            throw "Impossível resolver função "+funcname+" pois ela não existe."
        }
        return this.parent.resolveFunc(funcname);
    }

    public lookupFunc(funcname:string): FuncDecl {
        const env = this.resolveFunc(funcname);
        return env.functions.get(funcname) as FuncDecl;
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

    public hasFunc(funcname:string): boolean {
        if (this.functions.has(funcname)) {
            return true
        }
        if (this.parent==undefined) {
            return false
        }
        return this.parent.hasFunc(funcname);
    }


    public declareFunc(func:FuncDecl) {
        const identifier = func.identifier;
        if (this.functions.has(identifier)) {throw "Função "+identifier+" já declarada";}
        this.functions.set(identifier,func);
        return func
    }

    public declareClass(classDecl:Class) {
        const identifier = classDecl.identifier;
        if (this.classes.has(identifier)) {throw "Classe "+identifier+" já declarada";}
        this.classes.set(identifier,classDecl);
        return classDecl;
    }

    public resolveClass(classname:string): Class {
        if (this.classes.has(classname)) {
            return this.classes.get(classname) as Class;
        }
        if (this.parent==undefined) {
            throw "Impossível resolver classe "+classname+" pois ela não existe."
        }
        return this.parent.resolveClass(classname);
    }
}