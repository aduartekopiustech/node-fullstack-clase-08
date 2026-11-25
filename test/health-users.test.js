import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createUser,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const USER_KEYS = ["id", "name", "email", "role"];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

describe("GET /api/health", () => {
  it("returns 200 with ok status", async () => {
    const res = await request.get("/api/health");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: "ok" });
  });
});

describe("Users regression", () => {
  it("POST /api/users creates user with Location header and never exposes password", async () => {
    const res = await request.post("/api/users").send({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "Password123!",
    });

    assert.equal(res.status, 201);
    assert.match(res.headers.location, /^\/api\/users\/\d+$/);
    assert.deepEqual(Object.keys(res.body.data), USER_KEYS);
    assert.equal(res.body.data.name, "Grace Hopper");
    assert.equal(res.body.data.email, "grace@example.com");
    assert.equal(res.body.data.role, "ROLE_USER");
    assert.equal("password" in res.body.data, false);
  });

  it("POST /api/users rejects duplicate email with 409 EMAIL_TAKEN", async () => {
    await createUser({ email: "duplicate@example.com" });

    const res = await request.post("/api/users").send({
      name: "Other User",
      email: "duplicate@example.com",
      password: "Password123!",
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "EMAIL_TAKEN");
  });

  it("GET /api/users returns users ordered by id ascending", async () => {
    const first = await createUser({ name: "First User" });
    const second = await createUser({ name: "Second User" });

    const res = await request.get("/api/users");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [first.id, second.id],
    );
    for (const item of res.body.data) {
      assert.deepEqual(Object.keys(item), USER_KEYS);
    }
  });

  it("GET /api/users/abc returns 400 INVALID_ID with exact User message", async () => {
    const res = await request.get("/api/users/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(res.body.error.message, "User id must be a positive integer");
  });

  it("GET /api/users/:id returns 404 USER_NOT_FOUND when missing", async () => {
    const res = await request.get("/api/users/999999");

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "USER_NOT_FOUND");
  });

  it("DELETE /api/users/:id deletes user and subsequent GET returns 404", async () => {
    const user = await createUser();

    const delRes = await request.delete(`/api/users/${user.id}`);
    assert.equal(delRes.status, 204);

    const getRes = await request.get(`/api/users/${user.id}`);
    assert.equal(getRes.status, 404);
    assert.equal(getRes.body.error.code, "USER_NOT_FOUND");
  });
});
