function $(r, t) {
  if (!r || r.size !== t.size)
    return !1;
  for (const [e, i] of r)
    if (!t.has(e) || t.get(e) !== i)
      return !1;
  return !0;
}
class O {
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
      this.execute(t, e, i).catch(() => {
      });
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
   * Destroys all registered items, removes all watchers and clears initialization errors.
   */
  async reset() {
    await this.destroyAll(), this.watchers.clear(), this.initializationErrors.clear();
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
    $(this.lastNotifiedItems, this.items) && $(this.lastNotifiedErrors, this.initializationErrors) || (this.lastNotifiedItems = new Map(this.items), this.lastNotifiedErrors = new Map(this.initializationErrors), this.watchers.forEach((t) => t(
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
function P(r, t) {
  let e = null;
  return (...i) => {
    e && clearTimeout(e), e = setTimeout(() => {
      t(...i);
    }, r);
  };
}
function S(r) {
  return Object.keys(r).length === 0 && r.constructor === Object;
}
function W(r) {
  let t = !1, e;
  return function(...i) {
    return t || (t = !0, e = r.apply(this, i)), e;
  };
}
function N(r) {
  return r.destroy = W(r.destroy.bind(r)), r;
}
function B(r, t) {
  const e = Object.entries(r).map(([i, a]) => [i, t(a, i)]);
  return Object.fromEntries(e);
}
function J(r, {
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
function k() {
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
function K(r, t, e) {
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
  }), /* @__PURE__ */ Object.create(null)), n = {
    ...e,
    roots: o,
    ...i && t.main?.element && {
      attachTo: t.main.element
    }
  };
  return delete n.root, n;
}
function G(r) {
  return Array.from(r.model.document.getRoots()).reduce((t, e) => (e.rootName === "$graveyard" || (t[e.rootName] = r.getData({ rootName: e.rootName })), t), /* @__PURE__ */ Object.create(null));
}
function D(r) {
  return "addEditable" in r.ui;
}
function I(r) {
  return ["inline", "classic", "balloon", "decoupled"].includes(r);
}
class w extends Error {
  constructor(t) {
    super(t), this.name = "CKEditor5SymfonyError";
  }
}
async function _(r) {
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
class x {
  static the = new x();
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
async function R(r) {
  const t = await import("ckeditor5");
  let e = null;
  const i = r.map(async (a) => {
    const o = await x.the.get(a);
    if (o)
      return o;
    const { [a]: n } = t;
    if (n)
      return n;
    if (!e)
      try {
        e = await import("ckeditor5-premium-features");
      } catch (s) {
        throw console.error(`Failed to load premium package: ${s}`), new w(`Plugin "${a}" not found in base package and failed to load premium package.`);
      }
    const { [a]: c } = e || {};
    if (c)
      return c;
    throw new w(`Plugin "${a}" not found in base or premium packages.`);
  });
  return {
    loadedPlugins: await Promise.all(i),
    hasPremium: !!e
  };
}
async function j(r, t) {
  const e = [r.ui, r.content];
  return await Promise.all(
    [
      M("ckeditor5", e),
      /* v8 ignore next */
      t && M("ckeditor5-premium-features", e)
    ].filter((a) => !!a)
  ).then((a) => a.flat());
}
async function M(r, t) {
  return await Promise.all(
    t.filter((e) => e !== "en").map(async (e) => {
      const i = await Q(r, e);
      return i?.default ?? i;
    }).filter(Boolean)
  );
}
async function Q(r, t) {
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
function q(r) {
  return B(r, (t) => ({
    dictionary: t
  }));
}
function L(r) {
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
function F() {
  return Array.from(document.querySelectorAll("cke5-editor")).map((r) => r.getAttribute("data-cke-editor-id")).filter((r) => r !== null);
}
function y(r) {
  if (!r || typeof r != "object")
    return r;
  if (Array.isArray(r))
    return r.map((i) => y(i));
  const t = r;
  if (t.$element && typeof t.$element == "string") {
    const i = document.querySelector(t.$element);
    return i || console.warn(`Element not found for selector: ${t.$element}`), i || null;
  }
  const e = /* @__PURE__ */ Object.create(null);
  for (const [i, a] of Object.entries(r))
    e[i] = y(a);
  return e;
}
function b(r, t, e) {
  if (!e || typeof e != "object")
    return e;
  if (Array.isArray(e))
    return e.map((o) => b(r, t, o));
  const i = e;
  if (i.$translation && typeof i.$translation == "string") {
    const o = i.$translation, n = X(r, o, t);
    return n === void 0 && console.warn(`Translation not found for key: ${o}`), n !== void 0 ? n : null;
  }
  const a = /* @__PURE__ */ Object.create(null);
  for (const [o, n] of Object.entries(e))
    a[o] = b(r, t, n);
  return a;
}
function X(r, t, e) {
  for (const i of r) {
    const a = i[e];
    if (a?.dictionary && t in a.dictionary)
      return a.dictionary[t];
  }
}
function Y(r, t) {
  const { editing: e } = r;
  e.view.change((i) => {
    i.setStyle("height", `${t}px`, e.view.document.getRoot());
  });
}
class h extends O {
  static the = new h();
}
class Z extends HTMLElement {
  /**
   * The promise that resolves to the context instance created for the current connection.
   */
  contextPromise = null;
  /**
   * Unregisters the error callback of the current context instance.
   */
  offEditorError = null;
  /**
   * Mounts the context component.
   */
  async connectedCallback() {
    if (await k(), !this.isConnected)
      return;
    const t = this.getAttribute("data-cke-context-id");
    h.the.resetErrors(t);
    const e = this.createContext();
    this.contextPromise = e;
    try {
      const i = await e, { onEditorError: a } = await import("ckeditor5");
      if (!this.isConnected)
        return;
      this.offEditorError = a(({ error: o, source: n }) => {
        if (n === i) {
          console.error(`CKEditor5 context with ID "${t}" failed.`, o);
          for (const c of i.editors)
            c.enableReadOnlyMode("error-handling");
        }
      }), h.the.register(t, i);
    } catch (i) {
      console.error(`Error initializing CKEditor5 context with ID "${t}":`, i), h.the.error(t, i);
    }
  }
  /**
   * Destroys the context component. Destroying the context destroys all its editors too.
   */
  async disconnectedCallback() {
    this.style.display = "none", this.offEditorError?.(), this.offEditorError = null;
    const { contextPromise: t } = this;
    if (this.contextPromise = null, !t)
      return;
    const e = await t.catch(() => null);
    if (!e)
      return;
    const i = this.getAttribute("data-cke-context-id");
    i && h.the.getItem(i) === e && h.the.unregister(i);
    try {
      await e.destroy();
    } catch (a) {
      console.error(`Failed to destroy CKEditor5 context with ID "${i}".`, a);
    }
  }
  /**
   * Loads plugins and translations and creates the context instance.
   */
  async createContext() {
    const t = JSON.parse(this.getAttribute("data-cke-language")), e = JSON.parse(this.getAttribute("data-cke-context")), { customTranslations: i, config: { plugins: a, ...o } } = e, { loadedPlugins: n, hasPremium: c } = await R(a ?? []), u = [
      ...await j(t, c),
      q(i || {})
    ].filter((g) => !S(g));
    let l = y(o);
    l = b(
      [...u].reverse(),
      t.ui,
      l
    );
    const { Context: p } = await import("ckeditor5"), f = await p.create({
      ...l,
      language: t,
      plugins: n,
      ...u.length && {
        translations: u
      }
    });
    return N(f);
  }
}
class m extends O {
  static the = new m();
}
class tt extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the editable component.
   */
  async connectedCallback() {
    await k(), this.hasAttribute("data-cke-editor-id") || this.setAttribute("data-cke-editor-id", F()[0]);
    const t = this.getAttribute("data-cke-editor-id"), e = this.getAttribute("data-cke-root-name"), i = this.getAttribute("data-cke-root-model-element-name") || "$root", a = this.getAttribute("data-cke-content"), o = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10);
    if (!t || !e)
      throw new w("Editor ID or Root Name is missing.");
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
      if (D(n)) {
        const { ui: l, editing: p } = n;
        n.addRoot(e, {
          isUndoable: !1,
          modelElement: i,
          ...a !== null && {
            initialData: a
          }
        });
        const f = this.querySelector("[data-cke-editable-content]"), g = l.view.createEditable(e, f);
        l.addEditable(g), p.view.forceRender();
      }
      const s = () => {
        const l = n.getData({ rootName: e });
        c && (c.value = l, c.dispatchEvent(new Event("input"))), this.dispatchEvent(new CustomEvent("change", { detail: { value: l } }));
      }, u = P(o, s);
      return n.model.document.on("change:data", u), s(), () => {
        if (n.model.document.off("change:data", u), n.state !== "destroyed" && e) {
          const l = n.model.document.getRoot(e);
          if (l && D(n)) {
            try {
              n.ui.view.editables[e] && n.detachEditable(l);
            } catch (p) {
              console.error("Unable unmount editable from root:", p);
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
async function et({
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
      const o = P(r, this.dispatch);
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
            roots: G(this.editor)
          },
          bubbles: !0
        })
      );
    };
  };
}
async function rt(r) {
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
      this.input = document.getElementById(`${o}_input`), this.input && (i.model.document.on("change:data", P(r, () => this.sync())), i.once("ready", this.sync), this.form = this.input.closest("form"), this.form?.addEventListener("submit", this.sync));
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
class it extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the editor component.
   */
  async connectedCallback() {
    await k(), this.isConnected && await this.initializeEditor();
  }
  /**
   * Initializes the editor instance.
   */
  async initializeEditor() {
    const t = this.getAttribute("data-cke-editor-id");
    m.the.resetErrors(t);
    try {
      this.style.display = "block";
      const [e, { onEditorError: i }] = await Promise.all([
        this.createEditor(),
        import("ckeditor5")
      ]);
      if (!this.isConnected) {
        await z(t, e);
        return;
      }
      const a = i(({ error: n, source: c }) => {
        c === e && (console.error(`CKEditor5 instance with ID "${t}" failed.`, n), e.enableReadOnlyMode("error-handling"));
      }), o = m.the.mountEffect(t, (n) => {
        n.once("destroy", () => {
          m.the.unregister(t, !1);
        }, { priority: "highest" });
      });
      this.unmountEffect = () => {
        m.the.unregister(t), o(), a(), z(t, e);
      }, m.the.register(t, e);
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
    const t = this.getAttribute("data-cke-editor-id"), e = JSON.parse(this.getAttribute("data-cke-preset")), i = this.getAttribute("data-cke-context-id"), a = this.getAttribute("data-cke-editable-height") ? Number.parseInt(this.getAttribute("data-cke-editable-height"), 10) : null, o = Number.parseInt(this.getAttribute("data-cke-save-debounce-ms"), 10), n = JSON.parse(this.getAttribute("data-cke-language")), {
      customTranslations: c,
      editorType: s,
      licenseKey: u,
      config: { plugins: l, ...p }
    } = e, f = await _(s), g = await (i ? h.the.waitFor(i) : null), { loadedPlugins: C, hasPremium: H } = await R(l);
    C.push(
      await et({
        saveDebounceMs: o,
        editorId: t,
        targetElement: this
      })
    ), I(s) && C.push(
      await rt(o)
    );
    const v = [
      ...await j(n, H),
      q(c || {})
    ].filter((V) => !S(V));
    let E = L(t);
    const A = Object.keys(E);
    I(s) && A.push("main"), U(E, A) || (E = await at(t, A));
    let d = {
      ...p,
      licenseKey: u,
      plugins: C,
      language: n,
      ...v.length && {
        translations: v
      }
    };
    d = y(d), d = b([...v].reverse(), n.ui, d), d = K(f, E, d);
    const T = await f.create(
      g ? { ...d, context: g } : d
    );
    return I(s) && a && Y(T, a), N(T);
  }
}
async function z(r, t) {
  try {
    await t.destroy();
  } catch (e) {
    console.error(`Failed to destroy CKEditor5 instance with ID "${r}".`, e);
  }
}
function U(r, t) {
  return t.every((e) => r[e]?.element);
}
async function at(r, t) {
  return J(
    () => {
      const e = L(r);
      if (!U(e, t))
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
class nt extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  unmountEffect = null;
  /**
   * Mounts the UI part component.
   */
  async connectedCallback() {
    await k();
    const t = this.getAttribute("data-cke-editor-id") || F()[0], e = this.getAttribute("data-cke-name");
    !t || !e || (this.style.display = "block", this.unmountEffect = m.the.mountEffect(t, (i) => {
      if (!this.isConnected)
        return;
      const { ui: a } = i, o = ot(e), n = a.view[o];
      if (!n)
        throw new w(`Unknown UI part name: "${e}". Supported names are "toolbar" and "menubar".`);
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
function ot(r) {
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
const st = {
  "cke5-editor": it,
  "cke5-context": Z,
  "cke5-ui-part": nt,
  "cke5-editable": tt
};
function ct() {
  for (const [r, t] of Object.entries(st))
    window.customElements.get(r) || window.customElements.define(r, t);
}
ct();
export {
  w as CKEditor5SymfonyError,
  h as ContextsRegistry,
  x as CustomEditorPluginsRegistry,
  tt as EditableComponentElement,
  it as EditorComponentElement,
  m as EditorsRegistry,
  nt as UIPartComponentElement
};
//# sourceMappingURL=index.mjs.map
