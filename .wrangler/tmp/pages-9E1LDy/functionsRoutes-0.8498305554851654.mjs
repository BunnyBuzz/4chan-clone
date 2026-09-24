import { onRequestGet as __api_threads__id__replies_js_onRequestGet } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\threads\\[id]\\replies.js"
import { onRequestPost as __api_threads__id__replies_js_onRequestPost } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\threads\\[id]\\replies.js"
import { onRequestGet as __api_threads__id__js_onRequestGet } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\threads\\[id].js"
import { onRequestPost as __api_delete_js_onRequestPost } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\delete.js"
import { onRequestGet as __api_feed_js_onRequestGet } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\feed.js"
import { onRequestPost as __api_threads_js_onRequestPost } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\threads.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "C:\\Users\\pc\\Desktop\\4chan-clone\\functions\\api\\upload.js"

export const routes = [
    {
      routePath: "/api/threads/:id/replies",
      mountPath: "/api/threads/:id",
      method: "GET",
      middlewares: [],
      modules: [__api_threads__id__replies_js_onRequestGet],
    },
  {
      routePath: "/api/threads/:id/replies",
      mountPath: "/api/threads/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_threads__id__replies_js_onRequestPost],
    },
  {
      routePath: "/api/threads/:id",
      mountPath: "/api/threads",
      method: "GET",
      middlewares: [],
      modules: [__api_threads__id__js_onRequestGet],
    },
  {
      routePath: "/api/delete",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_js_onRequestPost],
    },
  {
      routePath: "/api/feed",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_feed_js_onRequestGet],
    },
  {
      routePath: "/api/threads",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_threads_js_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  ]