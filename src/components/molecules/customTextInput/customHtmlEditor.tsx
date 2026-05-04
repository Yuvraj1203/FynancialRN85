import { TenantInfo } from '@/tenantInfo';
import { useTheme } from '@/theme/themeProvider/paperTheme';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  NativeSyntheticEvent,
  PixelRatio,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';

export type CustomHtmlEditorRef = {
  insertMention: (mention: string, currentWord: string) => void;
  insertHtml: (html: string) => void;
  insertText: (text: string) => void;
  focus: () => void;
  setHtml: (html: string) => void;
  getHtml: () => string | undefined;
  requestHtml?: () => Promise<string>;
  dismissKeyboard: () => void;
};

// ✅ Non-deprecated content-size event type
export type ContentSizeChangeEvent = NativeSyntheticEvent<{
  contentSize: { height: number; width: number };
}>;

type Props = {
  value: string;
  onChange: (html: string) => void;
  onMessage?: (msg: any) => void;
  placeholder?: string;
  scrollEnabled?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: StyleProp<ViewStyle>;
  error?: string;
  onContentSizeChange?: (e: ContentSizeChangeEvent) => void;
  fullSize?: boolean;
};

const CustomHtmlEditor = forwardRef<CustomHtmlEditorRef, Props>(
  (
    {
      value,
      onChange,
      onMessage,
      placeholder = 'Start typing...',
      scrollEnabled = true,
      onBlur,
      onFocus,
      style,
      onContentSizeChange,
      fullSize = true,
    },
    ref,
  ) => {
    const theme = useTheme();
    const webviewRef = useRef<WebView>(null);
    const initialHtmlSent = useRef(false);
    const lastHtml = useRef<string | undefined>(undefined);
    const pendingHtmlRequests = useRef<Record<string, (s: string) => void>>({});

    const androidFontSize = 16 / PixelRatio.getFontScale();
    const iosFontSize =
      16 / PixelRatio.getFontScale() > 16 ? 16 / PixelRatio.getFontScale() : 16;

    const fixedFontSize = Platform.OS === 'ios' ? iosFontSize : androidFontSize;

    const injectJS = (jsBody: string) => {
      const js = `
        (function(){
          ${jsBody}
        })();
        true;
      `;
      webviewRef.current?.injectJavaScript(js);
    };

    const injectSetHtml = (html: string) => {
      injectJS(
        `window.__SET_EDITOR_HTML && window.__SET_EDITOR_HTML(${JSON.stringify(
          html || '',
        )});`,
      );
    };

    const injectPastePayload = (payload: { text: string; html?: string }) => {
      injectJS(
        `window.__PASTE_FROM_RN && window.__PASTE_FROM_RN(${JSON.stringify(
          payload,
        )});`,
      );
    };

    const injectInsertMention = (mention: string, currentWord: string) => {
      injectJS(
        `window.__INSERT_MENTION && window.__INSERT_MENTION(${JSON.stringify(
          mention || '',
        )}, ${JSON.stringify(currentWord || '')});`,
      );
    };

    const injectFocus = () => {
      injectJS(`
        var ed = document.getElementById("editor");
        if (ed) ed.focus();
      `);
    };

    const injectInsertHtml = (html: string) => {
      injectJS(`
    window.__INSERT_HTML_AT_CURSOR &&
    window.__INSERT_HTML_AT_CURSOR(${JSON.stringify(html)});
  `);
    };

    const injectInsertText = (text: string) => {
      injectJS(`
    window.__INSERT_HTML_AT_CURSOR &&
    window.__INSERT_HTML_AT_CURSOR(${JSON.stringify(
      text.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    )});
  `);
    };

    const injectDismissKeyboard = () => {
      injectJS(`
    window.__DISMISS_KEYBOARD && window.__DISMISS_KEYBOARD();
  `);
    };

    useImperativeHandle(ref, () => ({
      insertMention: (mention: string, currentWord: string) => {
        injectInsertMention(mention, currentWord);
      },
      insertHtml: (html: string) => injectInsertHtml(html),

      insertText: (text: string) => injectInsertText(text),
      focus: () => injectFocus(),
      setHtml: (html: string) => injectSetHtml(html),
      getHtml: () => lastHtml.current,
      requestHtml: () => {
        return new Promise<string>(resolve => {
          try {
            const id = String(Date.now()) + Math.random().toString(16).slice(2);
            pendingHtmlRequests.current[id] = resolve;
            // ask webview to post current innerHTML with id
            injectJS(
              `(function(){ try{ var ed = document.getElementById('editor'); window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HTML_SNAPSHOT', id: '${id}', html: (ed && ed.innerHTML) ? ed.innerHTML : '' })); }catch(e){} })();`,
            );
            // fallback timeout: resolve with lastHtml after 250ms if webview doesn't respond
            setTimeout(() => {
              if (pendingHtmlRequests.current[id]) {
                const val = lastHtml.current || '';
                pendingHtmlRequests.current[id](val);
                delete pendingHtmlRequests.current[id];
              }
            }, 250);
          } catch (e) {
            resolve(lastHtml.current || '');
          }
        });
      },
      dismissKeyboard: () => injectDismissKeyboard(),
    }));

    const onWebviewLoad = () => {
      //if (initialHtmlSent.current) return;
      injectSetHtml(value || '');
      initialHtmlSent.current = true;
    };

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta name="referrer" content="origin">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>


<style>
  html, body {
  width: 100%;
  ${fullSize && 'height: 100%;'}
  max-width: 100%;
  margin: 0;
  padding: 0;
  ${fullSize ? 'overflow-x: hidden;' : 'overflow:hidden;'}
    font-family: -apple-system, BlinkMacSystemFont,
    "SF Pro Text", "SF Pro Display",
    "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;

  line-height: 1.4;
  -webkit-text-size-adjust: 100%;
  background: transparent;
}

#editorWrap {
  width: 100%;
  ${fullSize && 'height: 100%;'}
  background: ${theme.colors.transparent};
  box-sizing: border-box;
  border-radius: ${theme.roundness}px;
  ${fullSize ? 'overflow: auto;' : 'overflow:hidden;'}
}
#editorWrap:focus {
  outline: none;
  border-color: ${theme.colors.primary};
  box-shadow: 0 0 0 2px ${theme.colors.primary}33;
}


#editor {
  width: 100%;
  max-width: 100%;
  ${fullSize && 'min-height: 100%;'}
  padding: 10px;
  margin: 0;
  border: none;
  box-sizing: border-box;
  outline: none;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: ${fixedFontSize}px;
  line-height: 20px;
   color: ${
     theme.dark ? theme.colors.onSurfaceVariant : theme.colors.onSurface
   };
}

#editor img,
#editor iframe,
#editor video {
  max-width: 100%;
  width: 100%;
  height: auto;
  display: block;
}
  #editor:empty:before {
  content: attr(data-placeholder);
   color: ${
     theme.dark ? theme.colors.onSurfaceVariant : theme.colors.onSurface
   };
  pointer-events: none;
}
</style>
</head>

<body>
  <div id="editorWrap">
    <div id="editor" contenteditable="true" data-placeholder="${placeholder}"></div>
  </div>

  <script>
    const editor = document.getElementById("editor");
    const editorWrap = document.getElementById("editorWrap");

    function postToRN(obj) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
    }

    function notifyChange() {
      window.ReactNativeWebView.postMessage(editor.innerHTML);
      scheduleEmit(false);
    }

    function looksLikeHtml(s) {
      if (!s) return false;
      const t = s.trim();
      return /<\\/?[a-z][\\s\\S]*>/i.test(t) && t.includes("<") && t.includes(">");
    }

    // ----------------------------------------------------------------
    // Content size emit (works for text + iframe/img/video load)
    // ----------------------------------------------------------------
    let __lastW = 0;
    let __lastH = 0;
    let __raf1 = 0;
    let __raf2 = 0;
    const __hooked = new WeakSet();
    function hookMediaLoads() {
      try {
        const nodes = editor.querySelectorAll("img,iframe,video");
        nodes.forEach((n) => {
          if (__hooked.has(n)) return;
          __hooked.add(n);
          n.addEventListener("load", () => scheduleEmit(true));
          n.addEventListener("error", () => scheduleEmit(true));
        });
      } catch(e) {}
    }
    function getContentSize() {
      // ✅ because editor is auto-height now, scrollHeight changes immediately
      const height = Math.ceil(editor.scrollHeight || 0);
      const width = Math.ceil((editorWrap && editorWrap.clientWidth) ? editorWrap.clientWidth : 0);
      return { height, width };
    }
    function emit(force) {
      try {
        hookMediaLoads();
        const s = getContentSize();
        const h = s.height;
        const w = s.width;
        if (!force && h === __lastH && w === __lastW) return;
        __lastH = h;
        __lastW = w;
        postToRN({ type: "CONTENT_SIZE", height: h, width: w });
      } catch(e) {}
    }
    function scheduleEmit(force) {
      try {
        if (__raf1) cancelAnimationFrame(__raf1);
        if (__raf2) cancelAnimationFrame(__raf2);
        __raf1 = requestAnimationFrame(() => {
          __raf2 = requestAnimationFrame(() => {
            __raf1 = 0; __raf2 = 0;
            emit(!!force);
          });
        });
      } catch(e) {
        emit(!!force);
      }
    }
    // Observe DOM changes (mentions insertion, formatting, media injected, etc.)
    try {
      const mo = new MutationObserver(() => scheduleEmit(false));
      mo.observe(editor, { childList: true, subtree: true, characterData: true, attributes: true });
    } catch(e) {}
    // ----------------------------------------------------------------
    // Editing helpers
    // ----------------------------------------------------------------
    function insertHtmlAtCursor(html) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        editor.insertAdjacentHTML("beforeend", html);
        return;
      }
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      const frag = document.createDocumentFragment();
      let node, lastNode = null;
      while ((node = temp.firstChild)) lastNode = frag.appendChild(node);

      range.insertNode(frag);

      if (lastNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    function insertTextAtCursor(text) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        editor.appendChild(document.createTextNode(text));
        return;
      }
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    let __savedRange = null;

function isRangeInsideEditor(r) {
  if (!r) return false;
  const sc = r.startContainer;
  return sc && editor.contains(sc);
}

function saveCaret() {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const r = sel.getRangeAt(0);
    if (!isRangeInsideEditor(r)) return;

    __savedRange = r.cloneRange();
  } catch (e) {}
}

function restoreCaret() {
  try {
    const sel = window.getSelection();
    if (!sel) return;

    // Prefer saved range
    if (__savedRange && isRangeInsideEditor(__savedRange)) {
      sel.removeAllRanges();
      sel.addRange(__savedRange);
      return;
    }

    // Fallback: place caret at end
    placeCaretAtEnd(editor);
  } catch (e) {}
}

function placeCaretAtEnd(el) {
  try {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    __savedRange = range.cloneRange();
  } catch (e) {}
}


    // ----------------------------------------------------------------
    // Paste pipeline: WebView -> RN clipboard -> WebView insert
    // ----------------------------------------------------------------
    editor.addEventListener("paste", function(e) {
      e.preventDefault();
      postToRN({ type: "REQUEST_CLIPBOARD_PASTE" });
    });

    window.__PASTE_FROM_RN = function(payload) {
      const t = (payload && payload.text ? String(payload.text) : "").trim();
      const h = (payload && payload.html ? String(payload.html) : "").trim();
      const incoming = h || t;
      if (!incoming) return;

      if (h || looksLikeHtml(t)) {
        insertHtmlAtCursor(h || t);
        notifyChange();
        return;
      }

      insertTextAtCursor(t);
      notifyChange();
    };

     window.__INSERT_HTML_AT_CURSOR = function(html) {
      if (!html) return;
      editor.focus();
      restoreCaret();    
      insertHtmlAtCursor(String(html));
      saveCaret(); 
      notifyChange();
    };

    window.__INSERT_TEXT_AT_CURSOR = function(text) {
      const t = String(text || "");
      if (!t) return;
      editor.focus();
       restoreCaret();    
      insertTextAtCursor(t);
      saveCaret(); 
      notifyChange();
    };

    window.__DISMISS_KEYBOARD = function () {
    try {
      // Blur editor if focused
      if (document.activeElement) {
        document.activeElement.blur();
      }

      // Explicit editor blur
      if (editor) {
        editor.blur();
      }

      // Clear selection (important for iOS)
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
      }
    } catch (e) {}
  };

    // ----------------------------------------------------------------
    // Mention insertion:
    // - If user typed "@", "@br" etc. -> replace currentWord
    // - If no currentWord -> append at caret
    // ----------------------------------------------------------------
    window.__INSERT_MENTION = function(mentionText, currentWord) {
      const mention = String(mentionText || "");
      const word = String(currentWord || "");

      if (!mention) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        insertHtmlAtCursor(mention + "&nbsp;");
        notifyChange();
        return;
      }

      const range = sel.getRangeAt(0);
      const container = range.startContainer;

      // If not text node, fallback to insert
      if (!container || container.nodeType !== Node.TEXT_NODE) {
        insertHtmlAtCursor(mention + "&nbsp;");
        notifyChange();
        return;
      }

      const text = container.textContent || "";
      const cursorOffset = range.startOffset;

      const leftText = text.slice(0, cursorOffset);
      const rightText = text.slice(cursorOffset);

      // If no word, append
      if (!word) {
        insertHtmlAtCursor(mention + "&nbsp;");
        notifyChange();
        return;
      }

      // Escape regex safely (NO inside template literal)
      const escapedWord = word.replace(/[.*+?^{}()|[\\]\\\\$]/g, '\\\\$&');
      // NOTE: above line is for JS string inside HTML template; actual regex is:
      // /[.*+?^{}()|[\]\\$]/g with correct escaping.

      // Because we're inside a template literal already, safest is to build using a function:
      function escapeRegExp(s) {
        return s.replace(/[.*+?^{}()|[\\]\\\\$]/g, '\\\\$&');
      }

      const re = new RegExp(escapeRegExp(word) + "$", "i");

      if (re.test(leftText)) {
        const newLeft = leftText.replace(re, "");
        container.textContent = newLeft + rightText;

        const newOffset = newLeft.length;
        const newRange = document.createRange();
        newRange.setStart(container, newOffset);
        newRange.setEnd(container, newOffset);
        sel.removeAllRanges();
        sel.addRange(newRange);

        insertHtmlAtCursor(mention + "&nbsp;");
        notifyChange();
        editor.focus();
        return;
      }

      // Fallback append
      insertHtmlAtCursor(mention + "&nbsp;");
      notifyChange();
      editor.focus();
    };

    // ----------------------------------------------------------------
    // Set initial HTML
    // ----------------------------------------------------------------
    window.__SET_EDITOR_HTML = function(html) {
      editor.innerHTML = html || "";
      placeCaretAtEnd(editor);
      postToRN({ type: "init", html: editor.innerHTML });
      scheduleEmit(true);
    };

    // ----------------------------------------------------------------
    // Cursor info for mentions
    // ----------------------------------------------------------------
    function getCursorInfo() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return { cursorIndex: 0, currentWord: "", fullText: "" };
      }

      const range = sel.getRangeAt(0);
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !editor.contains(anchorNode)) {
        return null;
      }

      const preRange = range.cloneRange();
      preRange.selectNodeContents(editor);
      preRange.setEnd(range.startContainer, range.startOffset);

      const textBeforeCaret = preRange.toString();
      const cursorIndex = textBeforeCaret.length;

      const leftMatch = textBeforeCaret.match(/[A-Za-z0-9_@-]+$/);
      const leftToken = leftMatch ? leftMatch[0] : "";

      const containerText = range.endContainer && range.endContainer.textContent
        ? range.endContainer.textContent
        : "";

      const rightPart = containerText.slice(range.endOffset);
      const rightMatch = rightPart.match(/^[A-Za-z0-9_-]+/);
      const rightToken = rightMatch ? rightMatch[0] : "";

      const currentWord = leftToken + rightToken;
      const fullText = editor.innerText;

      return { cursorIndex, currentWord, fullText };
    }

    let __lastCursorPayload = "";
    function emitCursorInfo() {
      const info = getCursorInfo();
      if (!info) return;

      const payload = JSON.stringify({
        type: "CURSOR_INFO",
        value: info.cursorIndex,
        word: info.currentWord,
        text: info.fullText
      });

      if (payload === __lastCursorPayload) return;
      __lastCursorPayload = payload;

      window.ReactNativeWebView.postMessage(payload);
    }

    document.addEventListener("selectionchange", ()=>{saveCaret(); emitCursorInfo(); });
    editor.addEventListener("keyup",()=>{saveCaret(); emitCursorInfo(); });
    editor.addEventListener("mouseup",()=>{saveCaret(); emitCursorInfo(); });
    editor.addEventListener("touchend", ()=>{saveCaret(); emitCursorInfo(); });

    // ----------------------------------------------------------------
    // Standard events
    // ----------------------------------------------------------------
    editor.addEventListener("input", () => notifyChange());
    editor.addEventListener("focus", () =>{ saveCaret(); postToRN({ type: "focus" });});
    editor.addEventListener("blur", () => postToRN({ type: "blur" }));

    window.addEventListener("resize", () => scheduleEmit(true));

    postToRN({ type: "EDITOR_READY" });
    scheduleEmit(true);
  </script>
</body>
</html>
`;

    const handleMessage = async (event: any) => {
      const raw = event?.nativeEvent?.data ?? '';

      // raw HTML updates
      if (typeof raw === 'string' && raw.trim().startsWith('<')) {
        lastHtml.current = raw;
        onChange(raw);
        return;
      }

      try {
        const data = JSON.parse(raw);

        // ✅ CONTENT_SIZE
        if (data?.type === 'CONTENT_SIZE') {
          onContentSizeChange?.({
            nativeEvent: {
              contentSize: {
                height: Number(data.height) || 0,
                width: Number(data.width) || 0,
              },
            },
          } as any);
        }

        // handle HTML_SNAPSHOT responses to pending requests
        if (data?.type === 'HTML_SNAPSHOT' && data?.id) {
          try {
            const id = String(data.id);
            const resolver = pendingHtmlRequests.current[id];
            if (resolver) {
              lastHtml.current = data.html || lastHtml.current;
              resolver(data.html || '');
              delete pendingHtmlRequests.current[id];
            }
          } catch (e) {}
        }

        if (data?.type === 'REQUEST_CLIPBOARD_PASTE') {
          const clipText = await Clipboard.getString();
          injectPastePayload({ text: clipText || '' });
          return;
        }

        if (data?.type === 'init') {
          onChange(data.html || '');
        }

        if (data?.type === 'focus') onFocus?.();
        if (data?.type === 'blur') onBlur?.();

        onMessage?.(data);
      } catch {
        if (typeof raw === 'string') onChange(raw);
      }
    };

    return (
      <View style={[{ flex: 1 }, style]}>
        <WebView
          ref={webviewRef}
          androidLayerType="hardware"
          scalesPageToFit={false}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={scrollEnabled}
          onLoadEnd={onWebviewLoad}
          onMessage={handleMessage}
          mixedContentMode="always"
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          source={{
            html: htmlTemplate,
            headers: {
              Referer: `https://${
                Platform.OS === 'ios'
                  ? TenantInfo.BundleId
                  : TenantInfo.PackageName
              }`,
            },
            baseUrl: `https://${
              Platform.OS === 'ios'
                ? TenantInfo.BundleId
                : TenantInfo.PackageName
            }`,
          }}
          style={{ backgroundColor: theme.colors.transparent }}
        />
      </View>
    );
  },
);

export default CustomHtmlEditor;
