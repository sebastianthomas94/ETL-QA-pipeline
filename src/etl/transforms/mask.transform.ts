import { Transform, TransformCallback } from "stream";
import { fakerEN_IN } from "@faker-js/faker";

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
            obj.email = fakerEN_IN.internet.email();
        }
        if (obj.name && obj.name !== "Guest") {
            obj.name = fakerEN_IN.person.fullName();
        }
        if (obj.firstName) {
            obj.firstName = fakerEN_IN.person.firstName();
        }
        if (obj.lastName) {
            obj.lastName = fakerEN_IN.person.lastName();
        }
        if (obj.phone) {
            obj.phone = fakerEN_IN.phone.number({ style: "international" });
        }
        if (obj.address) {
            obj.address = fakerEN_IN.location.streetAddress();
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
