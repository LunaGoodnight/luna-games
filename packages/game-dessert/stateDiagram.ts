import {setup} from "xstate";

export interface IMachineContext {

    soundOn: boolean;

}
export const dessertMachine = setup({
 types: {
     context: {} as IMachineContext,
 }
}).createMachine({
    context: {
        soundOn: true,
    }
})