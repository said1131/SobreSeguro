export default class Usuario {
    constructor(
        public id: number,
        public firstName: string,
        public lastName: string,
        public email: string,
        public password: string,
        public createdAt: Date = new Date()
    ) {}
}
