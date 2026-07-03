"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Usuario {
    constructor(id, firstName, lastName, email, password, createdAt = new Date()) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
    }
}
exports.default = Usuario;
