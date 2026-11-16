// Same-origin API. Authentication uses a server-issued HttpOnly cookie, never localStorage.
export async function request(path, { method = "GET", body = undefined } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers:
      body === undefined || body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Object.assign(
      new Error(data.error || "Servern kunde inte nås."),
      { status: response.status, response: { data } },
    );
    window.dispatchEvent(new CustomEvent("api-error", { detail: error }));
    throw error;
  }
  return data;
}
const collection = (name) => {
  const list = async (sort = "", limit = 500) => {
    const admin =
      window.location.pathname.startsWith("/admin") || name === "Order";
    let rows = await request(`/${admin ? "admin" : "catalog"}/${name}`);
    if (sort) {
      const field = sort.replace(/^-/, "");
      const dir = sort.startsWith("-") ? -1 : 1;
      rows.sort((a, b) =>
        a[field] < b[field] ? -dir : a[field] > b[field] ? dir : 0,
      );
    }
    return rows.slice(0, limit);
  };
  return {
    list,
    async filter(filter = {}, sort = "", limit = 500) {
      return (await list(sort, limit)).filter((r) =>
        Object.entries(filter).every(([k, v]) => r[k] === v),
      );
    },
    create: (body) => request(`/admin/${name}`, { method: "POST", body }),
    update: (id, body) =>
      request(`/admin/${name}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    delete: (id) =>
      request(`/admin/${name}/${encodeURIComponent(id)}`, { method: "DELETE" }),
    subscribe: (callback) => {
      const timer = setInterval(callback, 10000);
      return () => clearInterval(timer);
    },
  };
};
export const api = {
  entities: Object.fromEntries(
    [
      "MenuItem",
      "MenuCategory",
      "RestaurantSettings",
      "DeliveryZone",
      "Order",
      "Offer",
    ].map((n) => [n, collection(n)]),
  ),
  auth: {
    me: () => request("/auth/me"),
    loginViaEmailPassword: (email, password) =>
      request("/auth/login", { method: "POST", body: { email, password } }),
    async logout(redirect = undefined) {
      await request("/auth/logout", { method: "POST", body: {} });
      if (redirect) window.location.assign("/login");
    },
    redirectToLogin: () => window.location.assign("/login?returnTo=/admin"),
  },
  functions: {
    async invoke(name, body) {
      const paths = {
        createOrder: "/orders",
        getOrderStatus: "/order-status",
        confirmStripePayment: "/order-status",
        createPaymentSession: "/payment-session",
        refundOrder: "/refund",
      };
      if (!paths[name]) throw new Error("Okänd serverfunktion.");
      return { data: await request(paths[name], { method: "POST", body }) };
    },
  },
  upload: async (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/uploads", { method: "POST", body });
  },
};
