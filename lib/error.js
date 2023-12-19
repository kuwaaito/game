// @ts-check
import * as CONFIG from "../config.js";
/** @enum { string } */
export const CODE = {
    NOT_FOUND:               "ERROR_NOT_FOUND",
    UNABLE_TO_PROCESS:       "ERROR_UNABLE_TO_PROCESS",
};
export const emit = function (filter, message) {
    if (filter || CONFIG.DEBUG_MODE ) { console.error(message); }
};
export const panic = function () {
    console.error("PANIC!");
};