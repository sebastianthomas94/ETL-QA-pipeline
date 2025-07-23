import { Transform, TransformCallback } from "stream";
import { faker } from "@faker-js/faker";

export class MaskTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    _transform(obj: any, _: BufferEncoding, done: TransformCallback) {
        if (!this.shouldTransform(obj)) {
            this.push(obj);
            console.warn(`Skipping transformation for object: ${JSON.stringify(obj)}`);
            done();
            return;
        }

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
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private shouldTransform(obj: any): boolean {
        const shouldTransform = this.isEducator(obj);
        return shouldTransform;
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    isEducator(obj: any): boolean {
        return obj?.accountType === "User";
    }
}
