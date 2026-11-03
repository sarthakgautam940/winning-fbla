import { describe, expect, it } from "vitest";
import { checkCode, signSession, verifySession } from "./auth";

describe("access code", () => {
  it("accepts the one code, ignoring surrounding whitespace", async () => {
    expect(await checkCode("9409049")).toBe(true);
    expect(await checkCode(" 9409049\n")).toBe(true);
  });

  it.each(["", "9409048", "940904", "94090490", "9409049a", "0000000"])("rejects %j", async (code) => {
    expect(await checkCode(code)).toBe(false);
  });
});

describe("session cookie", () => {
  it("verifies a token it signed", async () => {
    const token = await signSession(1_700_000_000);
    expect(await verifySession(token)).toEqual({ u: "ashwath", iat: 1_700_000_000 });
  });

  it("rejects a token whose payload was edited", async () => {
    const [, sig] = (await signSession(1_700_000_000)).split(".");
    const forged = Buffer.from(JSON.stringify({ u: "ashwath", iat: 1_800_000_000 })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a token whose signature was edited", async () => {
    const [payload, sig] = (await signSession()).split(".");
    const edited = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(await verifySession(`${payload}.${edited}`)).toBeNull();
  });

  it.each([undefined, null, "", "not-a-token", "a.b.c"])("rejects %j", async (token) => {
    expect(await verifySession(token)).toBeNull();
  });
});
