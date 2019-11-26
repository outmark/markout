const {frameElement, ResizeObserver} = globalThis;

const ResizeObserverPrototype = {
  /** @type {() => void} */
  handler: undefined,
  /** @type {() => void} */
  connect: undefined,
  /** @type {() => void} */
  disconnect: undefined,
  size: '0×0',
  interval: 1000,
  update() {
    typeof this.handler !== 'function' ||
      this.size === (this.size = `${document.body.scrollWidth || 0}×${document.body.scrollHeight || 0}`) ||
      this.handler();
  },
};

/** @param {() => void} handler */
export const createResizeObserver = handler => {
  /** @type {typeof ResizeObserverPrototype} */
  const observer = {...ResizeObserverPrototype, handler};

  if (typeof ResizeObserver === 'function') {
    observer.observer = new ResizeObserver(handler);
    ({
      connect: observer.connect = (ResizeObserverPrototype.connect = {
        connect() {
          this.observer.observe(document.body);
        },
      }.connect),
      disconnect: observer.disconnect = (ResizeObserverPrototype.disconnect = {
        disconnect() {
          this.observer.disconnect();
        },
      }.disconnect),
    } = ResizeObserverPrototype);
  } else {
    ({
      connect: observer.connect = (ResizeObserverPrototype.connect = {
        connect() {
          this.disconnect();
          this.size = ResizeObserverPrototype.size;
          this.timer = setInterval(
            () => this.update(),
            (this.interval = this.interval > 0 && this.interval < Infinity ? Number(this.interval) : 1000),
          );
          this.update();
          // console.log(this, {...this});
        },
      }.connect),
      disconnect: observer.disconnect = (ResizeObserverPrototype.disconnect = {
        disconnect() {
          this.timer = void (this.timer == null || clearInterval(this.timer));
        },
      }.disconnect),
    } = ResizeObserverPrototype);
  }
  return observer;
};

export const debounce = ƒ => {
  const debounce = () => {
    debounce.frame === undefined || (cancelAnimationFrame(debounce.frame), (debounce.frame = undefined));
    debounce.frame = requestAnimationFrame(debounce.function);
  };
  Object.defineProperty(debounce, 'function', {value: ƒ, writable: false});
  return debounce;
};

export const resizeFrameElement = async () => {
  let updateHeight;
  if ('resizeObserver' in document) return;
  if (document.defaultView !== document.defaultView.parent) {
    document.body.style.minHeight = document.body.style.maxHeight = document.body.style.height = document.body.style.overflowY =
      'initial';
  }

  if (!frameElement) {
    return;
    // updateHeight = debounce(() => {
    // 	window.resizeTo(window.outerWidth, document.documentElement.scrollWidth);
    // });
  } else {
    frameElement.width = '100%';
    frameElement.height = '0';
    updateHeight = debounce(() => void (frameElement.height = document.documentElement.scrollHeight));
  }

  document.defaultView.addEventListener('resize', updateHeight);
  Object.defineProperty(document, 'resizeObserver', {
    value: createResizeObserver(updateHeight),
    writable: false,
  }).resizeObserver.connect();

  await new Promise(setTimeout);
};

if (frameElement) {
  /[?&]resize(?:&|$)/.test(import.meta.url) && resizeFrameElement();
}
