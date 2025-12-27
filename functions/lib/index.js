"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = exports.instagram = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const instagram_1 = __importDefault(require("./instagram"));
(0, v2_1.setGlobalOptions)({ maxInstances: 10 });
// 🚫 NO secrets here (Option 2)
exports.instagram = (0, https_1.onRequest)(instagram_1.default);
exports.health = (0, https_1.onRequest)((req, res) => {
    res.send("Dotler backend running");
});
