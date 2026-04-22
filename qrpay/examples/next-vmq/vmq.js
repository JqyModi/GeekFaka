"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatVmqPrice = formatVmqPrice;
exports.signVmqCreateOrder = signVmqCreateOrder;
exports.verifyVmqCallback = verifyVmqCallback;
exports.createVmqOrder = createVmqOrder;
var node_crypto_1 = require("node:crypto");
function md5(input) {
    return node_crypto_1.default.createHash("md5").update(input).digest("hex");
}
function formatVmqPrice(amount) {
    return amount.toFixed(2);
}
function signVmqCreateOrder(params) {
    var _a;
    return md5("".concat(params.payId).concat((_a = params.param) !== null && _a !== void 0 ? _a : "").concat(params.type).concat(params.price).concat(params.key));
}
function verifyVmqCallback(payload, key) {
    var _a;
    var expected = md5("".concat(payload.payId).concat((_a = payload.param) !== null && _a !== void 0 ? _a : "").concat(payload.type).concat(payload.price).concat(payload.reallyPrice).concat(key));
    return expected === payload.sign;
}
function createVmqOrder(baseUrl, key, input) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, response, json;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    payload = new URLSearchParams({
                        payId: input.payId,
                        type: String(input.type),
                        price: input.price,
                        param: (_a = input.param) !== null && _a !== void 0 ? _a : "",
                        notifyUrl: input.notifyUrl,
                        returnUrl: input.returnUrl,
                        isHtml: String((_b = input.isHtml) !== null && _b !== void 0 ? _b : 0),
                        sign: signVmqCreateOrder({
                            payId: input.payId,
                            param: input.param,
                            type: input.type,
                            price: input.price,
                            key: key,
                        }),
                    });
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/createOrder"), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: payload.toString(),
                            cache: "no-store",
                        })];
                case 1:
                    response = _c.sent();
                    if (!response.ok) {
                        throw new Error("VMQ createOrder failed with status ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    json = (_c.sent());
                    if (json.code !== 1 || !json.data) {
                        throw new Error(json.msg || "VMQ createOrder failed");
                    }
                    return [2 /*return*/, json.data];
            }
        });
    });
}
