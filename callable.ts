import Environment from "./environment.ts";
import { RuntimeVal } from "./values.ts";

export interface Callable {
    call(env:Environment):RuntimeVal
}