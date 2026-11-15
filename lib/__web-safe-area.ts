import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";

const noop = () => {};

/**
 * Injects the iPhone 16 Pro status bar into the Expo web preview.
 * Returns a cleanup function for the DOM nodes, polling interval and body color.
 */
export function startWebSafeArea(): () => void {
  if (typeof document === "undefined") return noop;
  if (document.getElementById("__runable_status_bar")) return noop;

  const previousBodyBackground = document.body.style.backgroundColor;
  const style = document.createElement("style");
  style.id = "__runable_safe_area";
  style.textContent = [
    "#root>div:first-child{padding-top:54px!important}",
    "#__runable_status_bar{position:fixed;top:0;left:0;right:0;height:64px;z-index:9999;pointer-events:none}",
    "#__runable_di{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:129px;height:37px;background:#000;border-radius:100px}",
    "#__runable_di::before{content:'';position:absolute;right:20px;top:50%;margin-top:-5px;width:10px;height:10px;border-radius:50%;background:radial-gradient(farthest-corner at 20% 20%,#6074bf 0,transparent 40%),radial-gradient(farthest-corner at 80% 80%,#513785 0,#24555e 20%,transparent 50%)}",
  ].join("");
  document.head.appendChild(style);

  const bar = document.createElement("div");
  bar.id = "__runable_status_bar";
  const di = document.createElement("div");
  di.id = "__runable_di";
  bar.appendChild(di);
  document.body.appendChild(bar);

  const interval = setInterval(() => {
    const x = Math.round(window.innerWidth / 2);
    const elements = document.elementsFromPoint(x, 62);
    for (const element of elements) {
      if (element === document.body || element === document.documentElement) continue;
      const background = getComputedStyle(element).backgroundColor;
      if (background && background !== "transparent" && background !== "rgba(0, 0, 0, 0)") {
        const alpha = background.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if (alpha && parseFloat(alpha[1]) < 0.5) continue;
        if (document.body.style.backgroundColor !== background) {
          document.body.style.backgroundColor = background;
        }
        return;
      }
    }
  }, 250);

  return () => {
    clearInterval(interval);
    style.remove();
    bar.remove();
    document.body.style.backgroundColor = previousBodyBackground;
  };
}
