function z(r, t) {
  if (!r || r.size !== t.size)
    return !1;
  for (const [e, i] of r)
    if (!t.has(e) || t.get(e) !== i)
      return !1;
  return !0;
}
class W {
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
   * Batch nesting depth. When > 0, watcher notifications are deferred.
   */
  batchDepth = 0;
  /**
   * Snapshot of the last state dispatched to watchers, used for change detection.
   */
  lastNotifiedItems = null;
  lastNotifiedErrors = null;
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
    const n = this.items.get(t), a = this.initializationErrors.get(t);
    return a ? (i?.(a), Promise.reject(a)) : n ? Promise.resolve(e(n)) : new Promise((s, u) => {
      const c = this.getPendingCallbacks(t);
      c.success.push(async (o) => {
        s(await e(o));
      }), i ? c.error.push(i) : c.error.push(u);
    });
  }
  /**
   * Reactively binds a mount/unmount lifecycle to a single registry item.
   *
   * @param id The ID of the item to observe.
   * @param onMount Function executed when the item mounts.
   * @returns A function that stops observing and immediately runs any pending cleanup.
   */
  mountEffect(t, e) {
    let i, n, a = !1;
    const s = this.watch((u) => {
      const c = u.get(t);
      if (c !== n && (i?.(), i = void 0, n = c, !!c))
        try {
          const o = e(c);
          a ? (o?.(), s()) : i = o;
        } catch (o) {
          throw console.error(o), o;
        }
    });
    return () => {
      a = !0, n && (s(), i?.(), i = void 0);
    };
  }
  /**
   * Registers an item.
   *
   * @param id The ID of the item.
   * @param item The item instance.
   */
  register(t, e) {
    this.batch(() => {
      if (this.items.has(t))
        throw new Error(`Item with ID "${t}" is already registered.`);
      this.resetErrors(t), this.items.set(t, e);
      const i = this.pendingCallbacks.get(t);
      i && (i.success.forEach((n) => n(e)), this.pendingCallbacks.delete(t)), this.items.size === 1 && t !== null && this.register(null, e);
    });
  }
  /**
   * Registers an error for an item.
   *
   * @param id The ID of the item.
   * @param error The error to register.
   */
  error(t, e) {
    this.batch(() => {
      this.items.delete(t), this.initializationErrors.set(t, e);
      const i = this.pendingCallbacks.get(t);
      i && (i.error.forEach((n) => n(e)), this.pendingCallbacks.delete(t)), this.initializationErrors.size === 1 && !this.items.size && this.error(null, e);
    });
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
   * @param resetPendingCallbacks If true resets pending callbacks.
   */
  unregister(t, e = !0) {
    this.batch(() => {
      t && this.items.get(null) === this.items.get(t) && this.unregister(null, !1), this.items.delete(t), e && this.pendingCallbacks.delete(t), this.resetErrors(t);
    });
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
   * Returns single registered item.
   *
   * @returns Registered item.
   */
  getItem(t) {
    return this.items.get(t);
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
   * @returns A promise that resolves with the item instance.
   */
  waitFor(t) {
    return new Promise((e, i) => {
      this.execute(t, e, i);
    });
  }
  /**
   * Destroys all registered items and clears the registry.
   * This will call the `destroy` method on each item.
   */
  async destroyAll() {
    const t = Array.from(new Set(this.items.values())).map((e) => e.destroy());
    this.items.clear(), this.pendingCallbacks.clear(), await Promise.all(t), this.flushWatchers();
  }
  /**
   * Destroys all registered editors and removes all watchers.
   */
  async reset() {
    await this.destroyAll(), this.watchers.clear();
  }
  /**
   * Executes a callback while deferring all watcher notifications.
   * A single notification is fired synchronously after the callback returns,
   * but only if the registry actually changed.
   *
   * Batches can be nested — watchers are notified only when the outermost
   * batch completes.
   *
   * @param fn The callback to execute.
   * @returns The return value of the callback.
   */
  batch(t) {
    this.batchDepth++;
    try {
      return t();
    } finally {
      this.batchDepth--, this.batchDepth === 0 && this.flushWatchers();
    }
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
   * Immediately dispatches the current state to all watchers if it changed.
   */
  flushWatchers() {
    z(this.lastNotifiedItems, this.items) && z(this.lastNotifiedErrors, this.initializationErrors) || (this.lastNotifiedItems = new Map(this.items), this.lastNotifiedErrors = new Map(this.initializationErrors), this.watchers.forEach((t) => t(
      new Map(this.items),
      new Map(this.initializationErrors)
    )));
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
}
function D(r, t) {
  let e = null;
  return (...i) => {
    e && clearTimeout(e), e = setTimeout(() => {
      t(...i);
    }, r);
  };
}
function j(r) {
  return Object.keys(r).length === 0 && r.constructor === Object;
}
function _(r, t) {
  const e = Object.entries(r).map(([i, n]) => [i, t(n, i)]);
  return Object.fromEntries(e);
}
function J() {
  return Math.random().toString(36).substring(2);
}
function G(r, {
  timeOutAfter: t = 500,
  retryAfter: e = 100
} = {}) {
  return new Promise((i, n) => {
    const a = Date.now();
    let s = null;
    const u = setTimeout(() => {
      n(s ?? new Error("Timeout"));
    }, t), c = async () => {
      try {
        const o = await r();
        clearTimeout(u), i(o);
      } catch (o) {
        s = o, Date.now() - a > t ? n(o) : setTimeout(c, e);
      }
    };
    c();
  });
}
function I() {
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
function Y(r, t, e) {
  const i = !r.editorName || r.editorName === "ClassicEditor", n = /* @__PURE__ */ new Set([
    ...Object.keys(t),
    ...Object.keys(e.roots ?? {})
  ]), a = Array.from(n).reduce((u, c) => ({
    ...u,
    [c]: {
      ...e.roots?.[c],
      ...c === "main" ? e.root : {},
      ...c in t ? {
        ...t[c].content !== null && {
          initialData: t[c].content
        },
        ...!i && t[c].element !== null && {
          element: t[c].element
        }
      } : {}
    }
  }), Object.create(e.roots || {})), s = {
    ...e,
    roots: a,
    ...i && t.main?.element && {
      attachTo: t.main.element
    }
  };
  return delete s.root, s;
}
const O = /* @__PURE__ */ Symbol.for("context-editor-watchdog");
async function X({ context: r, creator: t, config: e }) {
  const i = J();
  await r.add({
    creator: t.create.bind(t),
    id: i,
    type: "editor",
    config: e
  });
  const n = r.getItem(i), a = {
    state: "available",
    editorContextId: i,
    context: r
  };
  n[O] = a;
  const s = r.destroy.bind(r);
  return r.destroy = async () => (a.state = "unavailable", s()), {
    ...a,
    editor: n
  };
}
function Q(r) {
  return O in r ? r[O] : null;
}
function Z(r) {
  return Array.from(r.model.document.getRoots()).reduce((t, e) => (e.rootName === "$graveyard" || (t[e.rootName] = r.getData({ rootName: e.rootName })), t), /* @__PURE__ */ Object.create({}));
}
function R(r) {
  return "addEditable" in r.ui;
}
function x(r) {
  return ["inline", "classic", "balloon", "decoupled"].includes(r);
}
class w extends Error {
  constructor(t) {
    super(t), this.name = "CKEditor5SymfonyError";
  }
}
async function K(r) {
  const t = await import("ckeditor5"), i = {
    inline: t.InlineEditor,
    balloon: t.BalloonEditor,
    classic: t.ClassicEditor,
    decoupled: t.DecoupledEditor,
    multiroot: t.MultiRootEditor
  }[r];
  if (!i)
    throw new w(`Unsupported editor type: ${r}`);
  return i;
}
class N {
  static the = new N();
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
      throw new w(`Plugin with name "${t}" is already registered.`);
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
      throw new w(`Plugin with name "${t}" is not registered.`);
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
async function q(r) {
  const t = await import("ckeditor5");
  let e = null;
  const i = r.map(async (n) => {
    const a = await N.the.get(n);
    if (a)
      return a;
    const { [n]: s } = t;
    if (s)
      return s;
    if (!e)
      try {
        e = await import("ckeditor5-premium-features");
      } catch (c) {
        throw console.error(`Failed to load premium package: ${c}`), new w(`Plugin "${n}" not found in base package and failed to load premium package.`);
      }
    const { [n]: u } = e || {};
    if (u)
      return u;
    throw new w(`Plugin "${n}" not found in base or premium packages.`);
  });
  return {
    loadedPlugins: await Promise.all(i),
    hasPremium: !!e
  };
}
async function H(r, t) {
  const e = [r.ui, r.content];
  return await Promise.all(
    [
      L("ckeditor5", e),
      /* v8 ignore next */
      t && L("ckeditor5-premium-features", e)
    ].filter((n) => !!n)
  ).then((n) => n.flat());
}
async function L(r, t) {
  return await Promise.all(
    t.filter((e) => e !== "en").map(async (e) => {
      const i = await tt(r, e);
      return i?.default ?? i;
    }).filter(Boolean)
  );
}
async function tt(r, t) {
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
function U(r) {
  return _(r, (t) => ({
    dictionary: t
  }));
}
function B(r) {
  const t = Array.from(document.querySelectorAll(`cke5-editable[data-cke-editor-id="${r}"]`)).reduce((a, s) => {
    const u = s.getAttribute("data-cke-root-name");
    return a[u] = {
      element: s.querySelector("[data-cke-editable-content]"),
      content: s.getAttribute("data-cke-content")
    }, a;
  }, /* @__PURE__ */ Object.create({})), e = document.querySelector(`cke5-editor[data-cke-editor-id="${r}"]`);
  if (!e)
    return t;
  const i = JSON.parse(e.getAttribute("data-cke-content")) ?? {}, n = document.querySelector(`#${r}_editor`);
  n && !t.main && (t.main = {
    element: n,
    content: i.main || ""
  });
  for (const [a, s] of Object.entries(i))
    t[a] ? t[a] = {
      ...t[a],
      content: t[a].content ?? s
    } : t[a] = {
      element: null,
      content: s
    };
  return t;
}
function F() {
  return Array.from(document.querySelectorAll("cke5-editor")).map((r) => r.getAttribute("data-cke-editor-id")).filter((r) => r !== null);
}
function v(r) {
  if (!r || typeof r != "object")
    return r;
  if (Array.isArray(r))
    return r.map((i) => v(i));
  const t = r;
  if (t.$element && typeof t.$element == "string") {
    const i = document.querySelector(t.$element);
    return i || console.warn(`Element not found for selector: ${t.$element}`), i || null;
  }
  const e = /* @__PURE__ */ Object.create(null);
  for (const [i, n] of Object.entries(r))
    e[i] = v(n);
  return e;
}
function A(r, t, e) {
  if (!e || typeof e != "object")
    return e;
  if (Array.isArray(e))
    return e.map((a) => A(r, t, a));
  const i = e;
  if (i.$translation && typeof i.$translation == "string") {
    const a = i.$translation, s = et(r, a, t);
    return s === void 0 && console.warn(`Translation not found for key: ${a}`), s !== void 0 ? s : null;
  }
  const n = /* @__PURE__ */ Object.create(null);
  for (const [a, s] of Object.entries(e))
    n[a] = A(r, t, s);
  return n;
}
function et(r, t, e) {
  for (const i of r) {
    const n = i[e];
    if (n?.dictionary && t in n.dictionary)
      return n.dictionary[t];
  }
}
function rt(r, t) {
  const { editing: e } = r;
  e.view.change((i) => {
    i.setStyle("height", `${t}px`, e.view.document.getRoot());
  });
}
const S = /* @__PURE__ */ Symbol.for("symfony-editor-watchdog");
async function it(r, t) {
  const { EditorWatchdog: e } = await import("ckeditor5"), i = new e(null, {
    crashNumberLimit: 10,
    minimumNonErrorTimePeriod: 5e3
  });
  return i.setCreator(async () => {
    const n = await r();
    return n[S] = i, n;
  }), i;
}
function at(r) {
  return S in r ? r[S] : null;
}
class y extends W {
  static the = new y();
}
class nt extends HTMLElement {
  /**
   * The promise that resolves to the context instance.
   */
  contextPromise = null;
  /**
   * Mounts the context component.
   */
  async connectedCallback() {
    await I();
    const t = this.getAttribute("data-cke-context-id"), e = JSON.parse(this.getAttribute("data-cke-language")), i = JSON.parse(this.getAttribute("data-cke-context")), { customTranslations: n, watchdogConfig: a, config: { plugins: s, ...u } } = i, { loadedPlugins: c, hasPremium: o } = await q(s ?? []), h = [
      ...await H(e, o),
      U(n || {})
    ].filter((p) => !j(p));
    this.contextPromise = (async () => {
      const { ContextWatchdog: p, Context: b } = await import("ckeditor5"), g = new p(b, {
        crashNumberLimit: 10,
        ...a
      });
      let l = v(u);
      return l = A(
        [...h].reverse(),
        e.ui,
        l
      ), await g.create({
        ...l,
        language: e,
        plugins: c,
        ...h.length && {
          translations: h
        }
      }), g.on("itemError", (...k) => {
        console.error("Context item error:", ...k);
      }), g;
    })();
    const E = await this.contextPromise;
    this.isConnected && y.the.register(t, E);
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
      this.contextPromise = null, t && y.the.hasItem(t) && y.the.unregister(t);
    }
  }
}
class m extends W {
  static the = new m();
}
class st extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the editable component.
   */
  async connectedCallback() {
    await I(), this.hasAttribute("data-cke-editor-id") || this.setAttribute("data-cke-editor-id", F()[0]);
    const t = this.getAttribute("data-cke-editor-id"), e = this.getAttribute("data-cke-root-name"), i = this.getAttribute("data-cke-content"), n = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10);
    if (!t || !e)
      throw new w("Editor ID or Root Name is missing.");
    this.style.display = "block", this.unmountEffect = m.the.mountEffect(t, (a) => {
      if (!this.isConnected)
        return;
      const s = this.querySelector("input");
      if (a.model.document.getRoot(e)) {
        if (i !== null) {
          const o = a.getData({ rootName: e });
          o && o !== i && a.setData({
            [e]: i
          });
        }
        return;
      }
      if (R(a)) {
        const { ui: o, editing: f } = a;
        a.addRoot(e, {
          isUndoable: !1,
          ...i !== null && {
            initialData: i
          }
        });
        const h = this.querySelector("[data-cke-editable-content]"), E = o.view.createEditable(e, h);
        o.addEditable(E), f.view.forceRender();
      }
      const u = () => {
        const o = a.getData({ rootName: e });
        s && (s.value = o, s.dispatchEvent(new Event("input"))), this.dispatchEvent(new CustomEvent("change", { detail: { value: o } }));
      }, c = D(n, u);
      return a.model.document.on("change:data", c), u(), () => {
        if (a.model.document.off("change:data", c), a.state !== "destroyed" && e) {
          const o = a.model.document.getRoot(e);
          if (o && R(a)) {
            try {
              a.ui.view.editables[e] && a.detachEditable(o);
            } catch (f) {
              console.error("Unable unmount editable from root:", f);
            }
            o.isAttached() && a.detachRoot(e, !1);
          }
        }
      };
    });
  }
  /**
   * Destroys the editable component. Unmounts root from the editor.
   */
  disconnectedCallback() {
    this.style.display = "none", this.unmountEffect?.(), this.unmountEffect = null;
  }
}
async function ot({
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
      const a = D(r, this.dispatch);
      this.editor.model.document.on("change:data", a), this.editor.once("ready", this.dispatch);
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
async function ct(r) {
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
      const { editor: i } = this, a = i.sourceElement.id.replace(/_editor$/, "");
      this.input = document.getElementById(`${a}_input`), this.input && (i.model.document.on("change:data", D(r, () => this.sync())), i.once("ready", this.sync), this.form = this.input.closest("form"), this.form?.addEventListener("submit", this.sync));
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
class ut extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the editor component.
   */
  async connectedCallback() {
    await I(), await this.initializeEditor();
  }
  /**
   * Initializes the editor instance.
   */
  async initializeEditor() {
    const t = this.getAttribute("data-cke-editor-id");
    m.the.resetErrors(t);
    try {
      this.style.display = "block";
      const e = await this.createEditor(), i = Q(e), n = at(e);
      if (this.isConnected) {
        const a = m.the.mountEffect(t, (s) => {
          s.once("destroy", () => {
            m.the.unregister(t, !1);
          }, { priority: "highest" });
        });
        this.unmountEffect = async () => {
          m.the.unregister(t), a(), i ? i.state !== "unavailable" && await i.context.remove(i.editorContextId) : n ? await n.destroy() : await e.destroy();
        }, m.the.register(t, e);
      }
    } catch (e) {
      console.error(`Error initializing CKEditor5 instance with ID "${t}":`, e), this.unmountEffect = null, m.the.error(t, e);
    }
  }
  /**
   * Destroys the editor instance when the component is destroyed.
   * This is important to prevent memory leaks and ensure that the editor is properly cleaned up.
   */
  disconnectedCallback() {
    this.style.display = "none", this.unmountEffect?.(), this.unmountEffect = null;
  }
  /**
   * Creates the CKEditor instance.
   */
  async createEditor() {
    const t = this.getAttribute("data-cke-editor-id"), e = JSON.parse(this.getAttribute("data-cke-preset")), i = this.getAttribute("data-cke-context-id"), n = this.getAttribute("data-cke-editable-height") ? Number.parseInt(this.getAttribute("data-cke-editable-height"), 10) : null, a = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10), s = JSON.parse(this.getAttribute("data-cke-language")), u = this.hasAttribute("data-cke-watchdog"), {
      customTranslations: c,
      editorType: o,
      licenseKey: f,
      config: { plugins: h, ...E }
    } = e, p = await K(o), b = await (i ? y.the.waitFor(i) : null), g = async () => {
      const { loadedPlugins: l, hasPremium: k } = await q(h);
      l.push(
        await ot({
          saveDebounceMs: a,
          editorId: t,
          targetElement: this
        })
      ), x(o) && l.push(
        await ct(a)
      );
      const P = [
        ...await H(s, k),
        U(c || {})
      ].filter(($) => !j($));
      let C = B(t);
      const T = Object.keys(C);
      x(o) && T.push("main"), V(C, T) || (C = await lt(t, T));
      let d = {
        ...E,
        licenseKey: f,
        plugins: l,
        language: s,
        ...P.length && {
          translations: P
        }
      };
      d = v(d), d = A([...P].reverse(), s.ui, d), d = Y(p, C, d);
      const M = await (async () => b ? (await X({
        context: b,
        creator: p,
        config: d
      })).editor : p.create(d))();
      return x(o) && n && rt(M, n), M;
    };
    if (u && !b) {
      const l = await it(g);
      return l.on("restart", () => {
        const k = l.editor;
        m.the.register(t, k);
      }), await l.create({}), l.editor;
    }
    return g();
  }
}
function V(r, t) {
  return t.every((e) => r[e]?.element);
}
async function lt(r, t) {
  return G(
    () => {
      const e = B(r);
      if (!V(e, t))
        throw new Error(
          `It looks like not all required root elements are present yet.
* If you want to wait for them, ensure they are registered before editor initialization.
* If you want lazy initialize roots, consider removing root values from the \`initialData\` config and assign initial data in editable components.
Missing roots: ${t.filter((i) => !e[i]?.element).join(", ")}.`
        );
      return e;
    },
    { timeOutAfter: 2e3, retryAfter: 100 }
  );
}
class mt extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the UI part component.
   */
  async connectedCallback() {
    await I();
    const t = this.getAttribute("data-cke-editor-id") || F()[0], e = this.getAttribute("data-cke-name");
    !t || !e || (this.style.display = "block", this.unmountEffect = m.the.mountEffect(t, (i) => {
      if (!this.isConnected)
        return;
      const { ui: n } = i, a = dt(e), s = n.view[a];
      if (!s)
        throw new w(`Unknown UI part name: "${e}". Supported names are "toolbar" and "menubar".`);
      return this.appendChild(s.element), () => {
        this.innerHTML = "";
      };
    }));
  }
  /**
   * Destroys the UI part component. Unmounts UI parts from the editor.
   */
  disconnectedCallback() {
    this.style.display = "none", this.unmountEffect?.(), this.unmountEffect = null;
  }
}
function dt(r) {
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
  "cke5-editor": ut,
  "cke5-context": nt,
  "cke5-ui-part": mt,
  "cke5-editable": st
};
function pt() {
  for (const [r, t] of Object.entries(ht))
    window.customElements.get(r) || window.customElements.define(r, t);
}
pt();
export {
  w as CKEditor5SymfonyError,
  y as ContextsRegistry,
  N as CustomEditorPluginsRegistry,
  st as EditableComponentElement,
  ut as EditorComponentElement,
  m as EditorsRegistry,
  mt as UIPartComponentElement
};
//# sourceMappingURL=index.mjs.map
