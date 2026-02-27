class q {
  /**
   * Map of registered items.
   */
  items = /* @__PURE__ */ new Map();
  /**
   * Map of initialization errors for items that failed to register.
   */
  initializationErrors = /* @__PURE__ */ new Map();
  /**
   * Map of pending callbacks waiting for items to be registered or fail.
   */
  pendingCallbacks = /* @__PURE__ */ new Map();
  /**
   * Set of watchers that observe changes to the registry.
   */
  watchers = /* @__PURE__ */ new Set();
  /**
   * Executes a function on an item.
   * If the item is not yet registered, it will wait for it to be registered.
   *
   * @param id The ID of the item.
   * @param onSuccess The function to execute.
   * @param onError Optional error callback.
   * @returns A promise that resolves with the result of the function.
   */
  execute(t, e, i) {
    const a = this.items.get(t), n = this.initializationErrors.get(t);
    return n ? (i?.(n), Promise.reject(n)) : a ? Promise.resolve(e(a)) : new Promise((s, o) => {
      const c = this.getPendingCallbacks(t);
      c.success.push(async (u) => {
        s(await e(u));
      }), i ? c.error.push(i) : c.error.push(o);
    });
  }
  /**
   * Registers an item.
   *
   * @param id The ID of the item.
   * @param item The item instance.
   */
  register(t, e) {
    if (this.items.has(t))
      throw new Error(`Item with ID "${t}" is already registered.`);
    this.resetErrors(t), this.items.set(t, e);
    const i = this.pendingCallbacks.get(t);
    i && (i.success.forEach((a) => a(e)), this.pendingCallbacks.delete(t)), this.registerAsDefault(t, e), this.notifyWatchers();
  }
  /**
   * Registers an error for an item.
   *
   * @param id The ID of the item.
   * @param error The error to register.
   */
  error(t, e) {
    this.items.delete(t), this.initializationErrors.set(t, e);
    const i = this.pendingCallbacks.get(t);
    i && (i.error.forEach((a) => a(e)), this.pendingCallbacks.delete(t)), this.initializationErrors.size === 1 && !this.items.size && this.error(null, e), this.notifyWatchers();
  }
  /**
   * Resets errors for an item.
   *
   * @param id The ID of the item.
   */
  resetErrors(t) {
    const { initializationErrors: e } = this;
    e.has(null) && e.get(null) === e.get(t) && e.delete(null), e.delete(t);
  }
  /**
   * Un-registers an item.
   *
   * @param id The ID of the item.
   */
  unregister(t) {
    if (!this.items.has(t))
      throw new Error(`Item with ID "${t}" is not registered.`);
    t && this.items.get(null) === this.items.get(t) && this.unregister(null), this.items.delete(t), this.pendingCallbacks.delete(t), this.notifyWatchers();
  }
  /**
   * Gets all registered items.
   *
   * @returns An array of all registered items.
   */
  getItems() {
    return Array.from(this.items.values());
  }
  /**
   * Checks if an item with the given ID is registered.
   *
   * @param id The ID of the item.
   * @returns `true` if the item is registered, `false` otherwise.
   */
  hasItem(t) {
    return this.items.has(t);
  }
  /**
   * Gets a promise that resolves with the item instance for the given ID.
   * If the item is not registered yet, it will wait for it to be registered.
   *
   * @param id The ID of the item.
   * @param timeout Optional timeout in milliseconds.
   * @returns A promise that resolves with the item instance.
   */
  waitFor(t, e) {
    return new Promise((i, a) => {
      let n = !1, s = null;
      this.execute(
        t,
        (o) => {
          n || (s !== null && clearTimeout(s), i(o));
        },
        (o) => {
          n || (s !== null && clearTimeout(s), a(o));
        }
      ), e && (s = setTimeout(() => {
        n = !0, a(new Error(`Timeout waiting for item with ID "${t}" to be registered.`));
      }, e));
    });
  }
  /**
   * Destroys all registered items and clears the registry.
   * This will call the `destroy` method on each item.
   */
  async destroyAll() {
    const t = Array.from(new Set(this.items.values())).map((e) => e.destroy());
    this.items.clear(), this.pendingCallbacks.clear(), await Promise.all(t), this.notifyWatchers();
  }
  /**
   * Registers a watcher that will be called whenever the registry changes.
   *
   * @param watcher The watcher function to register.
   * @returns A function to unregister the watcher.
   */
  watch(t) {
    return this.watchers.add(t), t(
      new Map(this.items),
      new Map(this.initializationErrors)
    ), this.unwatch.bind(this, t);
  }
  /**
   * Un-registers a watcher.
   *
   * @param watcher The watcher function to unregister.
   */
  unwatch(t) {
    this.watchers.delete(t);
  }
  /**
   * Resets the registry by clearing all items, errors, and pending callbacks.
   */
  reset() {
    this.items.clear(), this.initializationErrors.clear(), this.pendingCallbacks.clear(), this.notifyWatchers();
  }
  /**
   * Notifies all watchers about changes to the registry.
   */
  notifyWatchers() {
    this.watchers.forEach(
      (t) => t(
        new Map(this.items),
        new Map(this.initializationErrors)
      )
    );
  }
  /**
   * Gets or creates pending callbacks for a specific ID.
   *
   * @param id The ID of the item.
   * @returns The pending callbacks structure.
   */
  getPendingCallbacks(t) {
    let e = this.pendingCallbacks.get(t);
    return e || (e = { success: [], error: [] }, this.pendingCallbacks.set(t, e)), e;
  }
  /**
   * Registers an item as the default (null ID) item if it's the first one.
   *
   * @param id The ID of the item being registered.
   * @param item The item instance.
   */
  registerAsDefault(t, e) {
    this.items.size === 1 && t !== null && this.register(null, e);
  }
}
function D(r, t) {
  let e = null;
  return (...i) => {
    e && clearTimeout(e), e = setTimeout(() => {
      t(...i);
    }, r);
  };
}
function K(r, t) {
  const e = Object.entries(r).filter(([i, a]) => t(a, i));
  return Object.fromEntries(e);
}
function j(r) {
  return Object.keys(r).length === 0 && r.constructor === Object;
}
function $(r, t) {
  const e = Object.entries(r).map(([i, a]) => [i, t(a, i)]);
  return Object.fromEntries(e);
}
function G() {
  return Math.random().toString(36).substring(2);
}
function Y(r, {
  timeOutAfter: t = 500,
  retryAfter: e = 100
} = {}) {
  return new Promise((i, a) => {
    const n = Date.now();
    let s = null;
    const o = setTimeout(() => {
      a(s ?? new Error("Timeout"));
    }, t), c = async () => {
      try {
        const u = await r();
        clearTimeout(o), i(u);
      } catch (u) {
        s = u, Date.now() - n > t ? a(u) : setTimeout(c, e);
      }
    };
    c();
  });
}
function T() {
  return new Promise((r) => {
    switch (document.readyState) {
      case "loading":
        document.addEventListener("DOMContentLoaded", () => r(), { once: !0 });
        break;
      case "interactive":
      case "complete":
        setTimeout(r, 0);
        break;
      default:
        console.warn("Unexpected document.readyState:", document.readyState), setTimeout(r, 0);
    }
  });
}
const O = /* @__PURE__ */ Symbol.for("context-editor-watchdog");
async function X({ element: r, context: t, creator: e, config: i }) {
  const a = G();
  await t.add({
    creator: (c, u) => e.create(c, u),
    id: a,
    sourceElementOrData: r,
    type: "editor",
    config: i
  });
  const n = t.getItem(a), s = {
    state: "available",
    editorContextId: a,
    context: t
  };
  n[O] = s;
  const o = t.destroy.bind(t);
  return t.destroy = async () => (s.state = "unavailable", o()), {
    ...s,
    editor: n
  };
}
function Q(r) {
  return O in r ? r[O] : null;
}
function Z(r) {
  return Array.from(r.model.document.getRoots()).reduce((t, e) => (e.rootName === "$graveyard" || (t[e.rootName] = r.getData({ rootName: e.rootName })), t), /* @__PURE__ */ Object.create({}));
}
function v(r) {
  return ["inline", "classic", "balloon", "decoupled"].includes(r);
}
class g extends Error {
  constructor(t) {
    super(t), this.name = "CKEditor5SymfonyError";
  }
}
async function tt(r) {
  const t = await import("ckeditor5"), i = {
    inline: t.InlineEditor,
    balloon: t.BalloonEditor,
    classic: t.ClassicEditor,
    decoupled: t.DecoupledEditor,
    multiroot: t.MultiRootEditor
  }[r];
  if (!i)
    throw new g(`Unsupported editor type: ${r}`);
  return i;
}
class M {
  static the = new M();
  /**
   * Map of registered custom plugins.
   */
  plugins = /* @__PURE__ */ new Map();
  /**
   * Private constructor to enforce singleton pattern.
   */
  constructor() {
  }
  /**
   * Registers a custom plugin for the CKEditor.
   *
   * @param name The name of the plugin.
   * @param reader The plugin reader function that returns the plugin constructor.
   * @returns A function to unregister the plugin.
   */
  register(t, e) {
    if (this.plugins.has(t))
      throw new g(`Plugin with name "${t}" is already registered.`);
    return this.plugins.set(t, e), this.unregister.bind(this, t);
  }
  /**
   * Removes a custom plugin by its name.
   *
   * @param name The name of the plugin to unregister.
   * @throws Will throw an error if the plugin is not registered.
   */
  unregister(t) {
    if (!this.plugins.has(t))
      throw new g(`Plugin with name "${t}" is not registered.`);
    this.plugins.delete(t);
  }
  /**
   * Removes all custom editor plugins.
   * This is useful for cleanup in tests or when reloading plugins.
   */
  unregisterAll() {
    this.plugins.clear();
  }
  /**
   * Retrieves a custom plugin by its name.
   *
   * @param name The name of the plugin.
   * @returns The plugin constructor or undefined if not found.
   */
  async get(t) {
    return this.plugins.get(t)?.();
  }
  /**
   * Checks if a plugin with the given name is registered.
   *
   * @param name The name of the plugin.
   * @returns `true` if the plugin is registered, `false` otherwise.
   */
  has(t) {
    return this.plugins.has(t);
  }
}
async function H(r) {
  const t = await import("ckeditor5");
  let e = null;
  const i = r.map(async (a) => {
    const n = await M.the.get(a);
    if (n)
      return n;
    const { [a]: s } = t;
    if (s)
      return s;
    if (!e)
      try {
        e = await import("ckeditor5-premium-features");
      } catch (c) {
        throw console.error(`Failed to load premium package: ${c}`), new g(`Plugin "${a}" not found in base package and failed to load premium package.`);
      }
    const { [a]: o } = e || {};
    if (o)
      return o;
    throw new g(`Plugin "${a}" not found in base or premium packages.`);
  });
  return {
    loadedPlugins: await Promise.all(i),
    hasPremium: !!e
  };
}
async function U(r, t) {
  const e = [r.ui, r.content];
  return await Promise.all(
    [
      L("ckeditor5", e),
      /* v8 ignore next */
      t && L("ckeditor5-premium-features", e)
    ].filter((a) => !!a)
  ).then((a) => a.flat());
}
async function L(r, t) {
  return await Promise.all(
    t.filter((e) => e !== "en").map(async (e) => {
      const i = await et(r, e);
      return i?.default ?? i;
    }).filter(Boolean)
  );
}
async function et(r, t) {
  try {
    if (r === "ckeditor5")
      switch (t) {
        case "af":
          return await import("ckeditor5/translations/af.js");
        case "ar":
          return await import("ckeditor5/translations/ar.js");
        case "ast":
          return await import("ckeditor5/translations/ast.js");
        case "az":
          return await import("ckeditor5/translations/az.js");
        case "bg":
          return await import("ckeditor5/translations/bg.js");
        case "bn":
          return await import("ckeditor5/translations/bn.js");
        case "bs":
          return await import("ckeditor5/translations/bs.js");
        case "ca":
          return await import("ckeditor5/translations/ca.js");
        case "cs":
          return await import("ckeditor5/translations/cs.js");
        case "da":
          return await import("ckeditor5/translations/da.js");
        case "de":
          return await import("ckeditor5/translations/de.js");
        case "de-ch":
          return await import("ckeditor5/translations/de-ch.js");
        case "el":
          return await import("ckeditor5/translations/el.js");
        case "en":
          return await import("ckeditor5/translations/en.js");
        case "en-au":
          return await import("ckeditor5/translations/en-au.js");
        case "en-gb":
          return await import("ckeditor5/translations/en-gb.js");
        case "eo":
          return await import("ckeditor5/translations/eo.js");
        case "es":
          return await import("ckeditor5/translations/es.js");
        case "es-co":
          return await import("ckeditor5/translations/es-co.js");
        case "et":
          return await import("ckeditor5/translations/et.js");
        case "eu":
          return await import("ckeditor5/translations/eu.js");
        case "fa":
          return await import("ckeditor5/translations/fa.js");
        case "fi":
          return await import("ckeditor5/translations/fi.js");
        case "fr":
          return await import("ckeditor5/translations/fr.js");
        case "gl":
          return await import("ckeditor5/translations/gl.js");
        case "gu":
          return await import("ckeditor5/translations/gu.js");
        case "he":
          return await import("ckeditor5/translations/he.js");
        case "hi":
          return await import("ckeditor5/translations/hi.js");
        case "hr":
          return await import("ckeditor5/translations/hr.js");
        case "hu":
          return await import("ckeditor5/translations/hu.js");
        case "hy":
          return await import("ckeditor5/translations/hy.js");
        case "id":
          return await import("ckeditor5/translations/id.js");
        case "it":
          return await import("ckeditor5/translations/it.js");
        case "ja":
          return await import("ckeditor5/translations/ja.js");
        case "jv":
          return await import("ckeditor5/translations/jv.js");
        case "kk":
          return await import("ckeditor5/translations/kk.js");
        case "km":
          return await import("ckeditor5/translations/km.js");
        case "kn":
          return await import("ckeditor5/translations/kn.js");
        case "ko":
          return await import("ckeditor5/translations/ko.js");
        case "ku":
          return await import("ckeditor5/translations/ku.js");
        case "lt":
          return await import("ckeditor5/translations/lt.js");
        case "lv":
          return await import("ckeditor5/translations/lv.js");
        case "ms":
          return await import("ckeditor5/translations/ms.js");
        case "nb":
          return await import("ckeditor5/translations/nb.js");
        case "ne":
          return await import("ckeditor5/translations/ne.js");
        case "nl":
          return await import("ckeditor5/translations/nl.js");
        case "no":
          return await import("ckeditor5/translations/no.js");
        case "oc":
          return await import("ckeditor5/translations/oc.js");
        case "pl":
          return await import("ckeditor5/translations/pl.js");
        case "pt":
          return await import("ckeditor5/translations/pt.js");
        case "pt-br":
          return await import("ckeditor5/translations/pt-br.js");
        case "ro":
          return await import("ckeditor5/translations/ro.js");
        case "ru":
          return await import("ckeditor5/translations/ru.js");
        case "si":
          return await import("ckeditor5/translations/si.js");
        case "sk":
          return await import("ckeditor5/translations/sk.js");
        case "sl":
          return await import("ckeditor5/translations/sl.js");
        case "sq":
          return await import("ckeditor5/translations/sq.js");
        case "sr":
          return await import("ckeditor5/translations/sr.js");
        case "sr-latn":
          return await import("ckeditor5/translations/sr-latn.js");
        case "sv":
          return await import("ckeditor5/translations/sv.js");
        case "th":
          return await import("ckeditor5/translations/th.js");
        case "tk":
          return await import("ckeditor5/translations/tk.js");
        case "tr":
          return await import("ckeditor5/translations/tr.js");
        case "tt":
          return await import("ckeditor5/translations/tt.js");
        case "ug":
          return await import("ckeditor5/translations/ug.js");
        case "uk":
          return await import("ckeditor5/translations/uk.js");
        case "ur":
          return await import("ckeditor5/translations/ur.js");
        case "uz":
          return await import("ckeditor5/translations/uz.js");
        case "vi":
          return await import("ckeditor5/translations/vi.js");
        case "zh":
          return await import("ckeditor5/translations/zh.js");
        case "zh-cn":
          return await import("ckeditor5/translations/zh-cn.js");
        default:
          return console.warn(`Language ${t} not found in ckeditor5 translations`), null;
      }
    else
      switch (t) {
        case "af":
          return await import("ckeditor5-premium-features/translations/af.js");
        case "ar":
          return await import("ckeditor5-premium-features/translations/ar.js");
        case "ast":
          return await import("ckeditor5-premium-features/translations/ast.js");
        case "az":
          return await import("ckeditor5-premium-features/translations/az.js");
        case "bg":
          return await import("ckeditor5-premium-features/translations/bg.js");
        case "bn":
          return await import("ckeditor5-premium-features/translations/bn.js");
        case "bs":
          return await import("ckeditor5-premium-features/translations/bs.js");
        case "ca":
          return await import("ckeditor5-premium-features/translations/ca.js");
        case "cs":
          return await import("ckeditor5-premium-features/translations/cs.js");
        case "da":
          return await import("ckeditor5-premium-features/translations/da.js");
        case "de":
          return await import("ckeditor5-premium-features/translations/de.js");
        case "de-ch":
          return await import("ckeditor5-premium-features/translations/de-ch.js");
        case "el":
          return await import("ckeditor5-premium-features/translations/el.js");
        case "en":
          return await import("ckeditor5-premium-features/translations/en.js");
        case "en-au":
          return await import("ckeditor5-premium-features/translations/en-au.js");
        case "en-gb":
          return await import("ckeditor5-premium-features/translations/en-gb.js");
        case "eo":
          return await import("ckeditor5-premium-features/translations/eo.js");
        case "es":
          return await import("ckeditor5-premium-features/translations/es.js");
        case "es-co":
          return await import("ckeditor5-premium-features/translations/es-co.js");
        case "et":
          return await import("ckeditor5-premium-features/translations/et.js");
        case "eu":
          return await import("ckeditor5-premium-features/translations/eu.js");
        case "fa":
          return await import("ckeditor5-premium-features/translations/fa.js");
        case "fi":
          return await import("ckeditor5-premium-features/translations/fi.js");
        case "fr":
          return await import("ckeditor5-premium-features/translations/fr.js");
        case "gl":
          return await import("ckeditor5-premium-features/translations/gl.js");
        case "gu":
          return await import("ckeditor5-premium-features/translations/gu.js");
        case "he":
          return await import("ckeditor5-premium-features/translations/he.js");
        case "hi":
          return await import("ckeditor5-premium-features/translations/hi.js");
        case "hr":
          return await import("ckeditor5-premium-features/translations/hr.js");
        case "hu":
          return await import("ckeditor5-premium-features/translations/hu.js");
        case "hy":
          return await import("ckeditor5-premium-features/translations/hy.js");
        case "id":
          return await import("ckeditor5-premium-features/translations/id.js");
        case "it":
          return await import("ckeditor5-premium-features/translations/it.js");
        case "ja":
          return await import("ckeditor5-premium-features/translations/ja.js");
        case "jv":
          return await import("ckeditor5-premium-features/translations/jv.js");
        case "kk":
          return await import("ckeditor5-premium-features/translations/kk.js");
        case "km":
          return await import("ckeditor5-premium-features/translations/km.js");
        case "kn":
          return await import("ckeditor5-premium-features/translations/kn.js");
        case "ko":
          return await import("ckeditor5-premium-features/translations/ko.js");
        case "ku":
          return await import("ckeditor5-premium-features/translations/ku.js");
        case "lt":
          return await import("ckeditor5-premium-features/translations/lt.js");
        case "lv":
          return await import("ckeditor5-premium-features/translations/lv.js");
        case "ms":
          return await import("ckeditor5-premium-features/translations/ms.js");
        case "nb":
          return await import("ckeditor5-premium-features/translations/nb.js");
        case "ne":
          return await import("ckeditor5-premium-features/translations/ne.js");
        case "nl":
          return await import("ckeditor5-premium-features/translations/nl.js");
        case "no":
          return await import("ckeditor5-premium-features/translations/no.js");
        case "oc":
          return await import("ckeditor5-premium-features/translations/oc.js");
        case "pl":
          return await import("ckeditor5-premium-features/translations/pl.js");
        case "pt":
          return await import("ckeditor5-premium-features/translations/pt.js");
        case "pt-br":
          return await import("ckeditor5-premium-features/translations/pt-br.js");
        case "ro":
          return await import("ckeditor5-premium-features/translations/ro.js");
        case "ru":
          return await import("ckeditor5-premium-features/translations/ru.js");
        case "si":
          return await import("ckeditor5-premium-features/translations/si.js");
        case "sk":
          return await import("ckeditor5-premium-features/translations/sk.js");
        case "sl":
          return await import("ckeditor5-premium-features/translations/sl.js");
        case "sq":
          return await import("ckeditor5-premium-features/translations/sq.js");
        case "sr":
          return await import("ckeditor5-premium-features/translations/sr.js");
        case "sr-latn":
          return await import("ckeditor5-premium-features/translations/sr-latn.js");
        case "sv":
          return await import("ckeditor5-premium-features/translations/sv.js");
        case "th":
          return await import("ckeditor5-premium-features/translations/th.js");
        case "tk":
          return await import("ckeditor5-premium-features/translations/tk.js");
        case "tr":
          return await import("ckeditor5-premium-features/translations/tr.js");
        case "tt":
          return await import("ckeditor5-premium-features/translations/tt.js");
        case "ug":
          return await import("ckeditor5-premium-features/translations/ug.js");
        case "uk":
          return await import("ckeditor5-premium-features/translations/uk.js");
        case "ur":
          return await import("ckeditor5-premium-features/translations/ur.js");
        case "uz":
          return await import("ckeditor5-premium-features/translations/uz.js");
        case "vi":
          return await import("ckeditor5-premium-features/translations/vi.js");
        case "zh":
          return await import("ckeditor5-premium-features/translations/zh.js");
        case "zh-cn":
          return await import("ckeditor5-premium-features/translations/zh-cn.js");
        default:
          return console.warn(`Language ${t} not found in premium translations`), await import("ckeditor5-premium-features/translations/en.js");
      }
  } catch (e) {
    return console.error(`Failed to load translation for ${r}/${t}:`, e), null;
  }
}
function V(r) {
  return $(r, (t) => ({
    dictionary: t
  }));
}
function B() {
  return Array.from(document.querySelectorAll("cke5-editor")).map((r) => r.getAttribute("data-cke-editor-id")).filter((r) => r !== null);
}
function F(r) {
  const t = J(r);
  return $(t, ({ element: e }) => e);
}
function W(r) {
  const t = J(r), e = $(t, ({ content: i }) => i);
  return K(e, (i) => typeof i == "string");
}
function J(r) {
  const t = Array.from(document.querySelectorAll(`cke5-editable[data-cke-editor-id="${r}"]`)).reduce((s, o) => {
    const c = o.getAttribute("data-cke-root-name"), u = o.getAttribute("data-cke-content");
    return s[c] = {
      element: o.querySelector("[data-cke-editable-content]"),
      content: u
    }, s;
  }, /* @__PURE__ */ Object.create({})), e = document.querySelector(`cke5-editor[data-cke-editor-id="${r}"]`);
  if (!e)
    return t;
  const i = t.main, a = JSON.parse(e.getAttribute("data-cke-content")), n = document.querySelector(`#${r}_editor `);
  return i && a?.main ? {
    ...t,
    main: {
      ...i,
      content: i.content || a.main
    }
  } : n ? {
    ...t,
    main: {
      element: n,
      content: a?.main || null
    }
  } : t;
}
function P(r) {
  if (!r || typeof r != "object")
    return r;
  if (Array.isArray(r))
    return r.map((i) => P(i));
  const t = r;
  if (t.$element && typeof t.$element == "string") {
    const i = document.querySelector(t.$element);
    return i || console.warn(`Element not found for selector: ${t.$element}`), i || null;
  }
  const e = /* @__PURE__ */ Object.create(null);
  for (const [i, a] of Object.entries(r))
    e[i] = P(a);
  return e;
}
function A(r, t, e) {
  if (!e || typeof e != "object")
    return e;
  if (Array.isArray(e))
    return e.map((n) => A(r, t, n));
  const i = e;
  if (i.$translation && typeof i.$translation == "string") {
    const n = i.$translation, s = rt(r, n, t);
    return s === void 0 && console.warn(`Translation not found for key: ${n}`), s !== void 0 ? s : null;
  }
  const a = /* @__PURE__ */ Object.create(null);
  for (const [n, s] of Object.entries(e))
    a[n] = A(r, t, s);
  return a;
}
function rt(r, t, e) {
  for (const i of r) {
    const a = i[e];
    if (a?.dictionary && t in a.dictionary)
      return a.dictionary[t];
  }
}
function it(r, t) {
  const { editing: e } = r;
  e.view.change((i) => {
    i.setStyle("height", `${t}px`, e.view.document.getRoot());
  });
}
const S = /* @__PURE__ */ Symbol.for("elixir-editor-watchdog");
async function at(r) {
  const { EditorWatchdog: t } = await import("ckeditor5"), e = new t(r);
  return e.setCreator(async (...i) => {
    const a = await r.create(...i);
    return a[S] = e, a;
  }), {
    watchdog: e,
    Constructor: {
      create: async (...i) => (await e.create(...i), e.editor)
    }
  };
}
function nt(r) {
  return S in r ? r[S] : null;
}
class k extends q {
  static the = new k();
}
class st extends HTMLElement {
  /**
   * The promise that resolves to the context instance.
   */
  contextPromise = null;
  /**
   * Mounts the context component.
   */
  async connectedCallback() {
    await T();
    const t = this.getAttribute("data-cke-context-id"), e = JSON.parse(this.getAttribute("data-cke-language")), i = JSON.parse(this.getAttribute("data-cke-context")), { customTranslations: a, watchdogConfig: n, config: { plugins: s, ...o } } = i, { loadedPlugins: c, hasPremium: u } = await H(s ?? []), h = [
      ...await U(e, u),
      V(a || {})
    ].filter((m) => !j(m));
    this.contextPromise = (async () => {
      const { ContextWatchdog: m, Context: b } = await import("ckeditor5"), w = new m(b, {
        crashNumberLimit: 10,
        ...n
      });
      let f = P(o);
      return f = A(
        [...h].reverse(),
        e.ui,
        f
      ), await w.create({
        ...f,
        language: e,
        plugins: c,
        ...h.length && {
          translations: h
        }
      }), w.on("itemError", (...I) => {
        console.error("Context item error:", ...I);
      }), w;
    })();
    const y = await this.contextPromise;
    this.isConnected && k.the.register(t, y);
  }
  /**
   * Destroys the context component. Unmounts root from the editor.
   */
  async disconnectedCallback() {
    const t = this.getAttribute("data-cke-context-id");
    this.style.display = "none";
    try {
      await (await this.contextPromise)?.destroy();
    } finally {
      this.contextPromise = null, t && k.the.hasItem(t) && k.the.unregister(t);
    }
  }
}
class d extends q {
  static the = new d();
}
class ot extends HTMLElement {
  /**
   * The promise that resolves when the editable is mounted.
   */
  editorPromise = null;
  /**
   * Mounts the editable component.
   */
  async connectedCallback() {
    await T(), this.hasAttribute("data-cke-editor-id") || this.setAttribute("data-cke-editor-id", B()[0]);
    const t = this.getAttribute("data-cke-editor-id"), e = this.getAttribute("data-cke-root-name"), i = this.getAttribute("data-cke-content"), a = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10);
    if (!t || !e)
      throw new g("Editor ID or Root Name is missing.");
    this.style.display = "block", this.editorPromise = d.the.execute(t, async (n) => {
      if (!this.isConnected)
        return null;
      const s = this.querySelector("input"), { ui: o, editing: c, model: u } = n;
      if (u.document.getRoot(e)) {
        if (i !== null) {
          const m = n.getData({ rootName: e });
          m && m !== i && n.setData({
            [e]: i
          });
        }
        return n;
      }
      n.addRoot(e, {
        isUndoable: !1,
        ...i !== null && {
          data: i
        }
      });
      const p = this.querySelector("[data-cke-editable-content]"), h = o.view.createEditable(e, p);
      o.addEditable(h), c.view.forceRender();
      const y = () => {
        const m = n.getData({ rootName: e });
        s && (s.value = m, s.dispatchEvent(new Event("input"))), this.dispatchEvent(new CustomEvent("change", { detail: { value: m } }));
      };
      return n.model.document.on("change:data", D(a, y)), y(), n;
    });
  }
  /**
   * Destroys the editable component. Unmounts root from the editor.
   */
  async disconnectedCallback() {
    const t = this.getAttribute("data-cke-root-name");
    this.style.display = "none";
    const e = await this.editorPromise;
    if (this.editorPromise = null, e && e.state !== "destroyed" && t) {
      const i = e.model.document.getRoot(t);
      if (i && "detachEditable" in e) {
        try {
          e.detachEditable(i);
        } catch (a) {
          console.error("Unable unmount editable from root:", a);
        }
        e.detachRoot(t, !1);
      }
    }
  }
}
async function ct({
  saveDebounceMs: r,
  editorId: t,
  targetElement: e
}) {
  const { Plugin: i } = await import("ckeditor5");
  return class extends i {
    /**
     * The name of the plugin.
     */
    static get pluginName() {
      return "DispatchEditorRootsChangeEvent";
    }
    /**
     * Initializes the plugin.
     */
    afterInit() {
      const n = D(r, this.dispatch);
      this.editor.model.document.on("change:data", n), this.editor.once("ready", this.dispatch);
    }
    /**
     * Dispatches a custom event with all roots data.
     */
    dispatch = () => {
      e.dispatchEvent(
        new CustomEvent("ckeditor5:change:data", {
          detail: {
            editorId: t,
            editor: this.editor,
            roots: Z(this.editor)
          },
          bubbles: !0
        })
      );
    };
  };
}
async function ut(r) {
  const { Plugin: t } = await import("ckeditor5");
  return class extends t {
    /**
     * The input element to synchronize with.
     */
    input = null;
    /**
     * The form element reference for cleanup.
     */
    form = null;
    /**
     * The name of the plugin.
     */
    static get pluginName() {
      return "SyncEditorWithInput";
    }
    /**
     * Initializes the plugin.
     */
    afterInit() {
      const { editor: i } = this, n = i.sourceElement.id.replace(/_editor$/, "");
      this.input = document.getElementById(`${n}_input`), this.input && (i.model.document.on("change:data", D(r, () => this.sync())), i.once("ready", this.sync), this.form = this.input.closest("form"), this.form?.addEventListener("submit", this.sync));
    }
    /**
     * Synchronizes the editor's content with the input field.
     */
    sync = () => {
      if (this.input) {
        const i = this.editor.getData();
        this.input.value = i, this.input.dispatchEvent(new Event("input", { bubbles: !0 }));
      }
    };
    /**
     * Destroys the plugin.
     */
    destroy() {
      this.form && this.form.removeEventListener("submit", this.sync), this.input = null, this.form = null;
    }
  };
}
class lt extends HTMLElement {
  /**
   * The promise that resolves to the editor instance.
   */
  editorPromise = null;
  /**
   * Mounts the editor component.
   */
  async connectedCallback() {
    await T();
    const t = this.getAttribute("data-cke-editor-id");
    d.the.resetErrors(t);
    try {
      this.style.display = "block", this.editorPromise = this.createEditor();
      const e = await this.editorPromise;
      this.isConnected && (d.the.register(t, e), e.once("destroy", () => {
        d.the.hasItem(t) && d.the.unregister(t);
      }));
    } catch (e) {
      console.error(`Error initializing CKEditor5 instance with ID "${t}":`, e), this.editorPromise = null, d.the.error(t, e);
    }
  }
  /**
   * Destroys the editor instance when the component is destroyed.
   * This is important to prevent memory leaks and ensure that the editor is properly cleaned up.
   */
  async disconnectedCallback() {
    this.style.display = "none";
    try {
      const t = await this.editorPromise;
      if (!t)
        return;
      const e = Q(t), i = nt(t);
      e ? e.state !== "unavailable" && await e.context.remove(e.editorContextId) : i ? await i.destroy() : await t.destroy();
    } finally {
      this.editorPromise = null;
    }
  }
  /**
   * Creates the CKEditor instance.
   */
  async createEditor() {
    const t = this.getAttribute("data-cke-editor-id"), e = JSON.parse(this.getAttribute("data-cke-preset")), i = this.getAttribute("data-cke-context-id"), a = this.getAttribute("data-cke-editable-height") ? Number.parseInt(this.getAttribute("data-cke-editable-height"), 10) : null, n = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10), s = JSON.parse(this.getAttribute("data-cke-language")), o = this.hasAttribute("data-cke-watchdog"), c = JSON.parse(this.getAttribute("data-cke-content")), {
      customTranslations: u,
      editorType: p,
      licenseKey: h,
      config: { plugins: y, ...m }
    } = e;
    let b = await tt(p);
    const w = await (i ? k.the.waitFor(i) : null);
    if (o && !w) {
      const l = await at(b);
      ({ Constructor: b } = l), l.watchdog.on("restart", () => {
        const E = l.watchdog.editor;
        this.editorPromise = Promise.resolve(E), d.the.register(t, E);
      });
    }
    const { loadedPlugins: f, hasPremium: I } = await H(y);
    f.push(
      await ct({
        saveDebounceMs: n,
        editorId: t,
        targetElement: this
      })
    ), v(p) && f.push(
      await ut(n)
    );
    const x = [
      ...await U(s, I),
      V(u || {})
    ].filter((l) => !j(l));
    let C = {
      ...c,
      ...W(t)
    };
    v(p) && (C = C.main || "");
    const z = await (async () => {
      let l = F(t);
      if (!l.main) {
        const R = v(p) ? ["main"] : Object.keys(C);
        _(l, R) || (l = await mt(t, R), C = {
          ...c,
          ...W(t)
        });
      }
      v(p) && "main" in l && (l = l.main);
      let E = P(m);
      E = A(
        [...x].reverse(),
        s.ui,
        E
      );
      const N = {
        ...E,
        initialData: C,
        licenseKey: h,
        plugins: f,
        language: s,
        ...x.length && {
          translations: x
        }
      };
      return !w || !(l instanceof HTMLElement) ? b.create(l, N) : (await X({
        context: w,
        element: l,
        creator: b,
        config: N
      })).editor;
    })();
    return v(p) && a && it(z, a), z;
  }
}
function _(r, t) {
  return t.every((e) => r[e]);
}
async function mt(r, t) {
  return Y(
    () => {
      const e = F(r);
      if (!_(e, t))
        throw new Error(
          `It looks like not all required root elements are present yet.
* If you want to wait for them, ensure they are registered before editor initialization.
* If you want lazy initialize roots, consider removing root values from the \`initialData\` config and assign initial data in editable components.
Missing roots: ${t.filter((i) => !e[i]).join(", ")}.`
        );
      return e;
    },
    { timeOutAfter: 2e3, retryAfter: 100 }
  );
}
class dt extends HTMLElement {
  /**
   * The promise that resolves when the UI part is mounted.
   */
  mountedPromise = null;
  /**
   * Mounts the UI part component.
   */
  async connectedCallback() {
    await T();
    const t = this.getAttribute("data-cke-editor-id") || B()[0], e = this.getAttribute("data-cke-name");
    !t || !e || (this.style.display = "block", this.mountedPromise = d.the.execute(t, (i) => {
      if (!this.isConnected)
        return;
      const { ui: a } = i, n = pt(e), s = a.view[n];
      if (!s)
        throw new g(`Unknown UI part name: "${e}". Supported names are "toolbar" and "menubar".`);
      this.appendChild(s.element);
    }));
  }
  /**
   * Destroys the UI part component. Unmounts UI parts from the editor.
   */
  async disconnectedCallback() {
    this.style.display = "none", await this.mountedPromise, this.mountedPromise = null, this.innerHTML = "";
  }
}
function pt(r) {
  switch (r) {
    case "toolbar":
      return "toolbar";
    case "menubar":
      return "menuBarView";
    /* v8 ignore next 3 */
    default:
      return null;
  }
}
const ht = {
  "cke5-editor": lt,
  "cke5-context": st,
  "cke5-ui-part": dt,
  "cke5-editable": ot
};
function wt() {
  for (const [r, t] of Object.entries(ht))
    window.customElements.get(r) || window.customElements.define(r, t);
}
wt();
export {
  g as CKEditor5SymfonyError,
  k as ContextsRegistry,
  M as CustomEditorPluginsRegistry,
  ot as EditableComponentElement,
  lt as EditorComponentElement,
  d as EditorsRegistry,
  dt as UIPartComponentElement
};
//# sourceMappingURL=index.mjs.map
