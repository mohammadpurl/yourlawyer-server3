"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setupApp;
function setupApp(app, express) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));
}
