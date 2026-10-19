(function () {
  const USERS_KEY = "muranga.users";
  const SESSION_KEY = "muranga.session";
  const DEMO_ADMIN = { name: "Service Administrator", email: "admin@muranga.go.ke", password: "Admin123!", role: "admin" };
  const DEMO_CITIZEN = { name: "Wanjiku Mwangi", email: "citizen@example.com", password: "Citizen123!", role: "citizen" };

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
    catch { return []; }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function encodeBytes(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }

  function decodeBytes(value) {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
  }

  async function hashPassword(password, saltValue) {
    const salt = saltValue ? decodeBytes(saltValue) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const result = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
    return { salt: encodeBytes(salt), hash: encodeBytes(result) };
  }

  async function ensureDemoUser(user) {
    const users = readUsers();
    if (users.some(existing => existing.email === user.email)) return;
    const credentials = await hashPassword(user.password);
    users.push({ name: user.name, email: user.email, role: user.role, ...credentials, createdAt: new Date().toISOString() });
    writeUsers(users);
  }

  function publicUser(user) {
    return { name: user.name, email: user.email, role: user.role };
  }

  window.Auth = {
    async init() {
      await ensureDemoUser(DEMO_ADMIN);
      await ensureDemoUser(DEMO_CITIZEN);
      readUsers();
    },

    current() {
      try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
        const user = readUsers().find(candidate => candidate.email === session?.email && candidate.role === session?.role);
        return user ? publicUser(user) : null;
      } catch { return null; }
    },

    async login(email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = readUsers().find(candidate => candidate.email === normalizedEmail);
      if (!user) return { ok: false, message: "We couldn't find an account with that email and password." };
      const result = await hashPassword(password, user.salt);
      if (result.hash !== user.hash) return { ok: false, message: "We couldn't find an account with that email and password." };
      const account = publicUser(user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
      return { ok: true, user: account };
    },

    async register(name, email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = readUsers();
      if (users.some(user => user.email === normalizedEmail)) return { ok: false, message: "An account with this email already exists." };
      const credentials = await hashPassword(password);
      const user = { name: name.trim(), email: normalizedEmail, role: "citizen", ...credentials, createdAt: new Date().toISOString() };
      users.push(user);
      writeUsers(users);
      const account = publicUser(user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
      return { ok: true, user: account };
    },

    logout() {
      sessionStorage.removeItem(SESSION_KEY);
    },

    demoCredentials() {
      return { admin: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password }, citizen: { email: DEMO_CITIZEN.email, password: DEMO_CITIZEN.password } };
    }
  };
})();