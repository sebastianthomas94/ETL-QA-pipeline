import { Transform, TransformCallback } from "stream";
import { faker } from "@faker-js/faker";

export class MaskTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    _transform(obj: any, _: BufferEncoding, done: TransformCallback) {
        // Mask sensitive data fields
        if (obj.email) {
            obj.email = faker.internet.email();
        }
        if (obj.name) {
            obj.name = faker.person.fullName();
        }
        if (obj.firstName) {
            obj.firstName = faker.person.firstName();
        }
        if (obj.lastName) {
            obj.lastName = faker.person.lastName();
        }
        if (obj.phone) {
            obj.phone = faker.phone.number();
        }
        if (obj.address) {
            obj.address = faker.location.streetAddress();
        }

        this.push(obj);
        done();
    }
}
