const request = require("supertest");
const app = require("../src/app");

describe("Document Routes", () => {
  it("should create or load document", async () => {
    const res = await request(app).get("/documents/1");
    expect(res.statusCode).toBe(200);
  });
});
