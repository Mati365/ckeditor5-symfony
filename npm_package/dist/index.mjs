function R(r, t) {
  if (!r || r.size !== t.size)
    return !1;
  for (const [e, i] of r)
    if (!t.has(e) || t.get(e) !== i)
      return !1;
  return !0;
}
class j {
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
    const a = this.items.get(t), o = this.initializationErrors.get(t);
    return o ? (i?.(o), Promise.reject(o)) : a ? Promise.resolve(e(a)) : new Promise((n, c) => {
      const s = this.getPendingCallbacks(t);
      s.success.push(async (u) => {
        n(await e(u));
      }), i ? s.error.push(i) : s.error.push(c);
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
    let i, a, o = !1;
    const n = this.watch((c) => {
      const s = c.get(t);
      if (s !== a && (i?.(), i = void 0, a = s, !!s))
        try {
          const u = e(s);
          o ? (u?.(), n()) : i = u;
        } catch (u) {
          throw console.error(u), u;
        }
    });
    return () => {
      o = !0, a && (n(), i?.(), i = void 0);
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
      i && (i.success.forEach((a) => a(e)), this.pendingCallbacks.delete(t)), this.items.size === 1 && t !== null && this.register(null, e);
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
      i && (i.error.forEach((a) => a(e)), this.pendingCallbacks.delete(t)), this.initializationErrors.size === 1 && !this.items.size && this.error(null, e);
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
    R(this.lastNotifiedItems, this.items) && R(this.lastNotifiedErrors, this.initializationErrors) || (this.lastNotifiedItems = new Map(this.items), this.lastNotifiedErrors = new Map(this.initializationErrors), this.watchers.forEach((t) => t(
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
function M(r, t) {
  let e = null;
  return (...i) => {
    e && clearTimeout(e), e = setTimeout(() => {
      t(...i);
    }, r);
  };
}
function q(r) {
  return Object.keys(r).length === 0 && r.constructor === Object;
}
function J(r, t) {
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
    const o = Date.now();
    let n = null;
    const c = setTimeout(() => {
      a(n ?? new Error("Timeout"));
    }, t), s = async () => {
      try {
        const u = await r();
        clearTimeout(c), i(u);
      } catch (u) {
        n = u, Date.now() - o > t ? a(u) : setTimeout(s, e);
      }
    };
    s();
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
function X(r, t, e) {
  const i = !r.editorName || r.editorName === "ClassicEditor", a = /* @__PURE__ */ new Set([
    ...Object.keys(t),
    ...Object.keys(e.roots ?? {})
  ]), o = Array.from(a).reduce((c, s) => ({
    ...c,
    [s]: {
      ...e.roots?.[s],
      ...s === "main" ? e.root : {},
      ...s in t ? {
        ...t[s].content !== null && {
          initialData: t[s].content
        },
        modelElement: t[s].modelElement || "$root",
        ...!i && t[s].element !== null && {
          element: t[s].element
        }
      } : {}
    }
  }), Object.create(e.roots || {})), n = {
    ...e,
    roots: o,
    ...i && t.main?.element && {
      attachTo: t.main.element
    }
  };
  return delete n.root, n;
}
const S = /* @__PURE__ */ Symbol.for("context-editor-watchdog");
async function Q({ context: r, creator: t, config: e }) {
  const i = G();
  await r.add({
    creator: t.create.bind(t),
    id: i,
    type: "editor",
    config: e
  });
  const a = r.getItem(i), o = {
    state: "available",
    editorContextId: i,
    context: r
  };
  a[S] = o;
  const n = r.destroy.bind(r);
  return r.destroy = async () => (o.state = "unavailable", n()), {
    ...o,
    editor: a
  };
}
function Z(r) {
  return S in r ? r[S] : null;
}
function K(r) {
  return Array.from(r.model.document.getRoots()).reduce((t, e) => (e.rootName === "$graveyard" || (t[e.rootName] = r.getData({ rootName: e.rootName })), t), /* @__PURE__ */ Object.create(null));
}
function L(r) {
  return "addEditable" in r.ui;
}
function O(r) {
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
    const o = await N.the.get(a);
    if (o)
      return o;
    const { [a]: n } = t;
    if (n)
      return n;
    if (!e)
      try {
        e = await import("ckeditor5-premium-features");
      } catch (s) {
        throw console.error(`Failed to load premium package: ${s}`), new g(`Plugin "${a}" not found in base package and failed to load premium package.`);
      }
    const { [a]: c } = e || {};
    if (c)
      return c;
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
      W("ckeditor5", e),
      /* v8 ignore next */
      t && W("ckeditor5-premium-features", e)
    ].filter((a) => !!a)
  ).then((a) => a.flat());
}
async function W(r, t) {
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
function B(r) {
  return J(r, (t) => ({
    dictionary: t
  }));
}
function F(r) {
  const t = Array.from(document.querySelectorAll(`cke5-editable[data-cke-editor-id="${r}"]`)).reduce((n, c) => {
    const s = c.getAttribute("data-cke-root-name"), u = c.getAttribute("data-cke-root-model-element-name") || null;
    return n[s] = {
      element: c.querySelector("[data-cke-editable-content]"),
      content: c.getAttribute("data-cke-content"),
      modelElement: u
    }, n;
  }, /* @__PURE__ */ Object.create(null)), e = document.querySelector(`cke5-editor[data-cke-editor-id="${r}"]`);
  if (!e)
    return t;
  const i = JSON.parse(e.getAttribute("data-cke-content")) ?? {}, a = document.querySelector(`#${r}_editor`), o = e.getAttribute("data-cke-root-model-element-name");
  "main" in t ? t.main.modelElement ??= o : a && !t.main && (t.main = {
    element: a,
    content: i.main || "",
    modelElement: o
  });
  for (const [n, c] of Object.entries(i))
    t[n] ? t[n] = {
      ...t[n],
      content: t[n].content ?? c,
      modelElement: t[n].modelElement ?? o
    } : t[n] = {
      element: null,
      content: c,
      modelElement: o
    };
  return t;
}
function V() {
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
  for (const [i, a] of Object.entries(r))
    e[i] = v(a);
  return e;
}
function A(r, t, e) {
  if (!e || typeof e != "object")
    return e;
  if (Array.isArray(e))
    return e.map((o) => A(r, t, o));
  const i = e;
  if (i.$translation && typeof i.$translation == "string") {
    const o = i.$translation, n = rt(r, o, t);
    return n === void 0 && console.warn(`Translation not found for key: ${o}`), n !== void 0 ? n : null;
  }
  const a = /* @__PURE__ */ Object.create(null);
  for (const [o, n] of Object.entries(e))
    a[o] = A(r, t, n);
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
const D = /* @__PURE__ */ Symbol.for("symfony-editor-watchdog");
async function at(r, t) {
  const { EditorWatchdog: e } = await import("ckeditor5"), i = new e(null, t ?? {
    crashNumberLimit: 10,
    minimumNonErrorTimePeriod: 5e3
  });
  return i.setCreator(async () => {
    const a = await r();
    return a[D] = i, a;
  }), i;
}
function nt(r) {
  return D in r ? r[D] : null;
}
class y extends j {
  static the = new y();
}
class ot extends HTMLElement {
  /**
   * The promise that resolves to the context instance.
   */
  contextPromise = null;
  /**
   * Mounts the context component.
   */
  async connectedCallback() {
    await I();
    const t = this.getAttribute("data-cke-context-id"), e = JSON.parse(this.getAttribute("data-cke-language")), i = JSON.parse(this.getAttribute("data-cke-context")), { customTranslations: a, watchdogConfig: o, config: { plugins: n, ...c } } = i, { loadedPlugins: s, hasPremium: u } = await H(n ?? []), h = [
      ...await U(e, u),
      B(a || {})
    ].filter((w) => !q(w));
    this.contextPromise = (async () => {
      const { ContextWatchdog: w, Context: k } = await import("ckeditor5"), f = new w(k, {
        crashNumberLimit: 10,
        ...o
      });
      let E = v(c);
      return E = A(
        [...h].reverse(),
        e.ui,
        E
      ), await f.create({
        ...E,
        language: e,
        plugins: s,
        ...h.length && {
          translations: h
        }
      }), f.on("itemError", (...d) => {
        console.error("Context item error:", ...d);
      }), f;
    })();
    const b = await this.contextPromise;
    this.isConnected && y.the.register(t, b);
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
class m extends j {
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
    await I(), this.hasAttribute("data-cke-editor-id") || this.setAttribute("data-cke-editor-id", V()[0]);
    const t = this.getAttribute("data-cke-editor-id"), e = this.getAttribute("data-cke-root-name"), i = this.getAttribute("data-cke-root-model-element-name") || "$root", a = this.getAttribute("data-cke-content"), o = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10);
    if (!t || !e)
      throw new g("Editor ID or Root Name is missing.");
    this.style.display = "block", this.unmountEffect = m.the.mountEffect(t, (n) => {
      if (!this.isConnected)
        return;
      const c = this.querySelector("input");
      if (n.model.document.getRoot(e)) {
        if (a !== null) {
          const l = n.getData({ rootName: e });
          l && l !== a && n.setData({
            [e]: a
          });
        }
        return;
      }
      if (L(n)) {
        const { ui: l, editing: h } = n;
        n.addRoot(e, {
          isUndoable: !1,
          modelElement: i,
          ...a !== null && {
            initialData: a
          }
        });
        const b = this.querySelector("[data-cke-editable-content]"), w = l.view.createEditable(e, b);
        l.addEditable(w), h.view.forceRender();
      }
      const s = () => {
        const l = n.getData({ rootName: e });
        c && (c.value = l, c.dispatchEvent(new Event("input"))), this.dispatchEvent(new CustomEvent("change", { detail: { value: l } }));
      }, u = M(o, s);
      return n.model.document.on("change:data", u), s(), () => {
        if (n.model.document.off("change:data", u), n.state !== "destroyed" && e) {
          const l = n.model.document.getRoot(e);
          if (l && L(n)) {
            try {
              n.ui.view.editables[e] && n.detachEditable(l);
            } catch (h) {
              console.error("Unable unmount editable from root:", h);
            }
            l.isAttached() && n.detachRoot(e, !1);
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
      const o = M(r, this.dispatch);
      this.editor.model.document.on("change:data", o), this.editor.once("ready", this.dispatch);
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
            roots: K(this.editor)
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
      const { editor: i } = this, o = i.sourceElement.id.replace(/_editor$/, "");
      this.input = document.getElementById(`${o}_input`), this.input && (i.model.document.on("change:data", M(r, () => this.sync())), i.once("ready", this.sync), this.form = this.input.closest("form"), this.form?.addEventListener("submit", this.sync));
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
      const e = await this.createEditor(), i = Z(e), a = nt(e);
      if (this.isConnected) {
        const o = m.the.mountEffect(t, (n) => {
          n.once("destroy", () => {
            m.the.unregister(t, !1);
          }, { priority: "highest" });
        });
        this.unmountEffect = async () => {
          m.the.unregister(t), o(), i ? i.state !== "unavailable" && await i.context.remove(i.editorContextId) : a ? await a.destroy() : await e.destroy();
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
    const t = this.getAttribute("data-cke-editor-id"), e = JSON.parse(this.getAttribute("data-cke-preset")), i = this.getAttribute("data-cke-context-id"), a = this.getAttribute("data-cke-editable-height") ? Number.parseInt(this.getAttribute("data-cke-editable-height"), 10) : null, o = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10), n = JSON.parse(this.getAttribute("data-cke-language")), c = this.hasAttribute("data-cke-watchdog"), {
      customTranslations: s,
      editorType: u,
      licenseKey: l,
      watchdogConfig: h,
      config: { plugins: b, ...w }
    } = e, k = await tt(u), f = await (i ? y.the.waitFor(i) : null), E = async () => {
      const { loadedPlugins: d, hasPremium: P } = await H(b);
      d.push(
        await ct({
          saveDebounceMs: o,
          editorId: t,
          targetElement: this
        })
      ), O(u) && d.push(
        await ut(o)
      );
      const T = [
        ...await U(n, P),
        B(s || {})
      ].filter((z) => !q(z));
      let C = F(t);
      const x = Object.keys(C);
      O(u) && x.push("main"), _(C, x) || (C = await mt(t, x));
      let p = {
        ...w,
        licenseKey: l,
        plugins: d,
        language: n,
        ...T.length && {
          translations: T
        }
      };
      p = v(p), p = A([...T].reverse(), n.ui, p), p = X(k, C, p);
      const $ = await (async () => f ? (await Q({
        context: f,
        creator: k,
        config: p
      })).editor : k.create(p))();
      return O(u) && a && it($, a), $;
    };
    if (c && !f) {
      const d = await at(E, h);
      return d.on("restart", () => {
        const P = d.editor;
        m.the.register(t, P);
      }), await d.create({}), d.editor;
    }
    return E();
  }
}
function _(r, t) {
  return t.every((e) => r[e]?.element);
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
Missing roots: ${t.filter((i) => !e[i]?.element).join(", ")}.`
        );
      return e;
    },
    { timeOutAfter: 2e3, retryAfter: 100 }
  );
}
class dt extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the UI part component.
   */
  async connectedCallback() {
    await I();
    const t = this.getAttribute("data-cke-editor-id") || V()[0], e = this.getAttribute("data-cke-name");
    !t || !e || (this.style.display = "block", this.unmountEffect = m.the.mountEffect(t, (i) => {
      if (!this.isConnected)
        return;
      const { ui: a } = i, o = ht(e), n = a.view[o];
      if (!n)
        throw new g(`Unknown UI part name: "${e}". Supported names are "toolbar" and "menubar".`);
      return this.appendChild(n.element), () => {
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
function ht(r) {
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
const pt = {
  "cke5-editor": lt,
  "cke5-context": ot,
  "cke5-ui-part": dt,
  "cke5-editable": st
};
function wt() {
  for (const [r, t] of Object.entries(pt))
    window.customElements.get(r) || window.customElements.define(r, t);
}
wt();
export {
  g as CKEditor5SymfonyError,
  y as ContextsRegistry,
  N as CustomEditorPluginsRegistry,
  st as EditableComponentElement,
  lt as EditorComponentElement,
  m as EditorsRegistry,
  dt as UIPartComponentElement
};
//# sourceMappingURL=index.mjs.map
