const request = require("supertest");
const app = require("../src/app");

describe("Auth Routes", () => {
  it("should return 401 for invalid login", async () => {
    const res = await request(app).post("/auth/login").send({ name: "foo", password: "bar" });
    expect(res.statusCode).toBe(401);
  });
});
