import { Transform, TransformCallback } from "stream";
import { fakerEN_IN } from "@faker-js/faker";
import { ShouldTransformCallback } from "./transform.selector";

export class MaskTransform extends Transform {
    constructor(private readonly shouldTransformCb?: ShouldTransformCallback) {
        super({ objectMode: true });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    _transform(obj: any, _: BufferEncoding, done: TransformCallback) {
        if (!this.shouldTransformCb?.(obj)) {
            this.push(obj);
            console.warn(`Skipping transformation for object: ${JSON.stringify(obj)}`);
            done();
            return;
        }

        this.maskNestedFields(obj);

        this.push(obj);
        done();
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private maskNestedFields(obj: any): void {
        if (obj === null || typeof obj !== "object") {
            return;
        }

        if (Array.isArray(obj)) {
            obj.forEach((item) => this.maskNestedFields(item));
            return;
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];

                if (key === "email" && value) {
                    obj[key] = fakerEN_IN.internet.email();
                } else if (key === "name" && value && value !== "Guest") {
                    obj[key] = fakerEN_IN.person.fullName();
                } else if (key === "firstName" && value) {
                    obj[key] = fakerEN_IN.person.firstName();
                } else if (key === "lastName" && value) {
                    obj[key] = fakerEN_IN.person.lastName();
                } else if (key === "phone" && value) {
                    obj[key] = fakerEN_IN.phone.number({ style: "international" });
                } else if (key === "address" && value) {
                    obj[key] = fakerEN_IN.location.streetAddress();
                } else if (typeof value === "object") {
                    this.maskNestedFields(value);
                }
            }
        }
    }
}
