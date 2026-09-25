function setupDropdown(triggerId, listId) {
    const trigger = document.getElementById(triggerId);
    const list = document.getElementById(listId);
    if (!trigger || !list) return;

    trigger.addEventListener("click", function(e) {
        e.preventDefault();
        list.style.display = (list.style.display === "block") ? "none" : "block";
    });

    document.addEventListener("click", function(e) {
        if (!e.target.closest("#" + triggerId) && !e.target.closest("#" + listId)) {
            list.style.display = "none";
        }
    });
}

setupDropdown("filter", "flist");
setupDropdown("options", "olist");
setupDropdown("post-menu-btn", "post-menu");

// Auth session: login UI state + token for API calls
window.cmMe = null;
function cmGetToken() {
    try { return localStorage.getItem("cm-session"); } catch (e) { return null; }
}
function cmSetToken(t) {
    try {
        if (t) localStorage.setItem("cm-session", t);
        else localStorage.removeItem("cm-session");
    } catch (e) {}
}
function cmAuthHeaders(extra) {
    var h = extra || {};
    var t = cmGetToken();
    if (t) h["Authorization"] = "Bearer " + t;
    return h;
}
function renderAuthState() {
    var form = document.querySelector(".formlog");
    var box = document.getElementById("userbox");
    if (form && box) {
        if (window.cmMe) {
            form.style.display = "none";
            box.style.display = "";
            var un = box.querySelector(".uname");
            if (un) un.textContent = window.cmMe.name;
        } else {
            form.style.display = "";
            box.style.display = "none";
        }
    }
    var nm = document.getElementById("composer-name");
    if (nm) {
        if (window.cmMe) { nm.value = window.cmMe.name; nm.disabled = true; }
        else nm.disabled = false;
    }
    if (typeof window.refreshFeedDelete === "function") window.refreshFeedDelete();
}
function cmRefreshMe() {
    if (!cmGetToken()) { window.cmMe = null; renderAuthState(); return; }
    fetch("/api/auth/me", { headers: cmAuthHeaders() }).then(function(res) {
        return res.json().then(function(j) {
            if (!res.ok || !j || !j.user) throw new Error("no session");
            return j.user;
        });
    }).then(function(u) {
        window.cmMe = u;
        renderAuthState();
    }).catch(function() {
        window.cmMe = null;
        renderAuthState();
    });
}
function cmAuthPost(url, body) {
    return fetch(url, {
        method: "POST",
        headers: cmAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body)
    }).then(function(res) {
        return res.json().then(function(j) {
            if (!res.ok || !j) throw new Error((j && j.error) || "request failed");
            return j;
        });
    });
}
var loginFormEl = document.querySelector(".formlog");
if (loginFormEl) loginFormEl.addEventListener("submit", function(e) {
    e.preventDefault();
    var u = document.getElementById("username");
    var p = document.getElementById("password");
    var msg = document.getElementById("auth-msg");
    var name = u ? u.value.trim() : "";
    var pass = p ? p.value : "";
    if (!name || !pass) { if (msg) msg.textContent = "Enter name + password."; return; }
    cmAuthPost("/api/auth/login", { name: name, password: pass }).then(function(j) {
        if (!j.token) throw new Error("Login failed.");
        cmSetToken(j.token);
        window.cmMe = j.user;
        if (p) p.value = "";
        if (msg) msg.textContent = "";
        renderAuthState();
    }).catch(function(err) { if (msg) msg.textContent = err.message; });
});
var registerBtnEl = document.getElementById("registertbtn");
if (registerBtnEl) registerBtnEl.addEventListener("click", function() {
    var u = document.getElementById("username");
    var p = document.getElementById("password");
    var msg = document.getElementById("auth-msg");
    var name = u ? u.value.trim() : "";
    var pass = p ? p.value : "";
    if (!name || !pass) { if (msg) msg.textContent = "Enter name + password."; return; }
    cmAuthPost("/api/auth/register", { name: name, password: pass }).then(function(j) {
        if (!j.token) throw new Error("Register failed.");
        cmSetToken(j.token);
        window.cmMe = j.user;
        if (p) p.value = "";
        if (msg) msg.textContent = "";
        renderAuthState();
    }).catch(function(err) { if (msg) msg.textContent = err.message; });
});
var logoutBtnEl = document.getElementById("logoutbtn");
if (logoutBtnEl) logoutBtnEl.addEventListener("click", function() {
    var t = cmGetToken();
    cmSetToken(null);
    window.cmMe = null;
    renderAuthState();
    if (t) fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": "Bearer " + t } }).catch(function() {});
});
cmRefreshMe();


document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("header");
    const closeBtn = document.getElementById("close-banner");

    if (localStorage.getItem("welcomeBannerHidden") === "true") {
        if (banner) banner.style.display = "none";
    }

    if (closeBtn && banner) {
        closeBtn.addEventListener("click", () => {
            banner.style.display = "none";
            localStorage.setItem("welcomeBannerHidden", "true");
        });
    }

    const postMenu = document.getElementById("post-menu");
    const reportLink = document.getElementById("post-report");
    const hideLink = document.getElementById("post-hide");
    if (reportLink) {
        reportLink.addEventListener("click", (e) => {
            e.preventDefault();
            reportLink.textContent = "Reported ✓";
            if (postMenu) postMenu.style.display = "none";
        });
    }
    if (hideLink) {
        hideLink.addEventListener("click", (e) => {
            e.preventDefault();
            const post = hideLink.closest(".community-post");
            if (postMenu) postMenu.style.display = "none";
            if (!post) return;
            const bar = document.createElement("div");
            bar.className = "post-hidden-bar";
            bar.innerHTML = '<span>Post hidden.</span> <a href="#" class="unhide-link">Undo</a>';
            post.replaceWith(bar);
            bar.querySelector(".unhide-link").addEventListener("click", (ev) => {
                ev.preventDefault();
                bar.replaceWith(post);
            });
        });
    }

    const composer = document.getElementById("composer-text");
    const charCount = document.getElementById("char-count");
    if (composer && charCount) {
        const MAX = 2000;
        composer.addEventListener("input", () => {
            charCount.textContent = composer.value.length + "/" + MAX;
        });
    }
});



// مصفوفة لحفظ الملفات المرفوعة حركياً
let uploadedFiles = [];

document.getElementById('file-upload').addEventListener('change', function(event) {
    const container = document.getElementById('images-container');
    const files = Array.from(event.target.files);

    files.forEach(file => {
        // إضافة الملف للمصفوفة
        uploadedFiles.push(file);

        // إنشاء عنصر صورة جديد لكل ملف مختار
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxHeight = "24px";
        img.style.width = "auto";
        img.style.borderRadius = "3px";
        img.style.cursor = "pointer";
        img.title = "اضغط لحذف الصورة";

        // 💡 عند الضغط على الصورة يتم إزالتها فوراً
        img.addEventListener('click', function() {
            // حذف الملف من المصفوفة البرمجية
            uploadedFiles = uploadedFiles.filter(f => f !== file);
            // حذف الصورة من الشاشة
            img.remove();
        });

        // إضافة الصورة بجانب الأزرار
        container.appendChild(img);
    });

    // إعادة تصفير الحقل ليقبل رفع نفس الصور مجدداً إن أراد المستخدم
    this.value = '';
});





// 1. تفعيل البحث عند الكتابة في الخانة
document.querySelector('#search').addEventListener('input', (e) => {
  filterPosts(e.target.value);
});

// 2. تفعيل البحث عند الضغط على أي Tag
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const tagText = tag.innerText.trim();
    document.querySelector('#search').value = tagText;
    filterPosts(tagText);
  });
});

// 3. دالة التصفية للمنشورات
function filterPosts(query) {
  const posts = document.querySelectorAll('.community-post');
  const filterText = query.toLowerCase();

  posts.forEach(post => {
    post.style.display = post.innerText.toLowerCase().includes(filterText) ? 'flex' : 'none';
  });
}



document.addEventListener("DOMContentLoaded", function() {
  const maxLength = 200; 
  const posts = document.querySelectorAll('.post-text');

  // دالة لاكتشاف الروابط وتحويلها إلى HTML
  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s"']+)/g;
    return text.replace(urlRegex, function(url) {
      return `<a href="${url}" target="_blank" class="post-link">${url}</a>`;
    });
  }

  posts.forEach(post => {
    let text = post.innerText.trim();

    if (text.length > maxLength) {
      // تفادي قص الرابط من المنتصف: البحث عن أول مسافة بعد الحد الأقصى
      let cutIndex = maxLength;
      while (cutIndex < text.length && text[cutIndex] !== ' ' && text[cutIndex] !== '\n') {
        cutIndex++;
      }

      // تقسيم النص
      let visiblePart = text.slice(0, cutIndex);
      let hiddenPart = text.slice(cutIndex);

      // تحويل الروابط في الجزئين
      visiblePart = linkify(visiblePart);
      hiddenPart = linkify(hiddenPart);

      post.innerHTML = `
        ${visiblePart}<span class="dots">...</span><span class="hidden-text" style="display:none;">${hiddenPart}</span>
        <span class="see-more-btn">see more</span>
      `;

      let btn = post.querySelector('.see-more-btn');
      let hiddenSpan = post.querySelector('.hidden-text');
      let dots = post.querySelector('.dots');

      btn.addEventListener('click', function() {
        if (hiddenSpan.style.display === 'none') {
          hiddenSpan.style.display = 'inline';
          dots.style.display = 'none';
          btn.innerText = ' see less';
        } else {
          hiddenSpan.style.display = 'none';
          dots.style.display = 'inline';
          btn.innerText = ' see more';
        }
      });
    } else {
      // إذا كان النص قصيراً، نطبق دالة الروابط فقط
      post.innerHTML = linkify(text);
    }
  });
});


// معرض صور متعددة + تكبير عند الضغط (يعمل تلقائياً على أي منشور فيه صور)
(function postGallery() {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<button type="button" class="lb-close" aria-label="Close">×</button><button type="button" class="lb-prev" aria-label="Previous">‹</button><img class="lb-img" alt="zoomed image"><button type="button" class="lb-next" aria-label="Next">›</button><span class="lb-count"></span>';
    document.body.appendChild(lightbox);
    const lbImg = lightbox.querySelector(".lb-img");
    const lbCount = lightbox.querySelector(".lb-count");
    const lbPrev = lightbox.querySelector(".lb-prev");
    const lbNext = lightbox.querySelector(".lb-next");
    let lbSrcs = [], lbIndex = 0;

    function renderLB() {
        lbImg.src = lbSrcs[lbIndex];
        const multi = lbSrcs.length > 1;
        lbCount.textContent = (lbIndex + 1) + " / " + lbSrcs.length;
        lbCount.style.display = multi ? "" : "none";
        lbPrev.style.display = multi ? "" : "none";
        lbNext.style.display = multi ? "" : "none";
    }
    function openLB(srcs, i) {
        lbSrcs = srcs;
        lbIndex = i;
        renderLB();
        lightbox.classList.add("open");
    }
    function closeLB() { lightbox.classList.remove("open"); }
    function step(d) {
        lbIndex = (lbIndex + d + lbSrcs.length) % lbSrcs.length;
        renderLB();
    }
    lightbox.querySelector(".lb-close").addEventListener("click", closeLB);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLB(); });
    lbPrev.addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
    lbNext.addEventListener("click", (e) => { e.stopPropagation(); step(1); });
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLB();
        if (e.key === "ArrowRight" && lbSrcs.length > 1) step(1);
        if (e.key === "ArrowLeft" && lbSrcs.length > 1) step(-1);
    });

    window.wirePostGallery = function(post) {
        const imgs = Array.from(post.querySelectorAll("img.post-media"));
        if (!imgs.length) return;
        const srcs = imgs.map((im) => im.currentSrc || im.src);
        if (srcs.length === 1) {
            imgs[0].addEventListener("click", () => openLB(srcs, 0));
            return;
        }
        let idx = 0;
        const wrap = document.createElement("div");
        wrap.className = "pgallery";
        const view = document.createElement("img");
        view.className = "post-media";
        view.alt = "post image";
        view.onerror = function() { view.style.display = "none"; };
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "pg-arrow pg-prev";
        prev.textContent = "‹";
        const next = document.createElement("button");
        next.type = "button";
        next.className = "pg-arrow pg-next";
        next.textContent = "›";
        const count = document.createElement("span");
        count.className = "pg-count";
        wrap.append(view, prev, next, count);
        imgs[0].before(wrap);
        imgs.forEach((im) => im.remove());
        const render = () => {
            view.src = srcs[idx];
            count.textContent = (idx + 1) + " / " + srcs.length;
        };
        prev.addEventListener("click", (e) => { e.stopPropagation(); idx = (idx - 1 + srcs.length) % srcs.length; render(); prev.blur(); });
        next.addEventListener("click", (e) => { e.stopPropagation(); idx = (idx + 1) % srcs.length; render(); next.blur(); });
        view.addEventListener("click", () => openLB(srcs, idx));
        render();
    };
    document.querySelectorAll(".community-post").forEach(window.wirePostGallery);
})();

// Feed: sync comment count from stored thread replies (same localStorage the thread page writes)
(function syncFeedCounts() {
    try {
        document.querySelectorAll(".post-action-link").forEach(function(link) {
            if (!link.lastChild) return;
            if (link.getAttribute("data-synced") === "1") return;
            var m = /[?&]id=([^&]+)/.exec(link.getAttribute("href") || "");
            if (!m) return;
            var all = JSON.parse(localStorage.getItem("cm-thread-replies-" + m[1]) || "[]");
            link.lastChild.textContent = " " + all.length;
        });
    } catch (e) {}
})();

// Likes: one toggle per browser (localStorage), counts shared via API
(function postLikes() {
    function likedSet() {
        try {
            var a = JSON.parse(localStorage.getItem("cm-liked") || "[]");
            return Array.isArray(a) ? a : [];
        } catch (e) { return []; }
    }
    function setLiked(id, on) {
        try {
            var a = likedSet().filter(function(x) { return x !== id; });
            if (on) a.push(id);
            localStorage.setItem("cm-liked", JSON.stringify(a));
        } catch (e) {}
    }
    function paint(btn, n, on) {
        var img = btn.querySelector("img");
        btn.innerHTML = "";
        if (img) btn.appendChild(img);
        btn.appendChild(document.createTextNode(" " + n));
        if (on) btn.classList.add("liked");
        else btn.classList.remove("liked");
    }
    function refresh(btn) {
        var tid = btn.getAttribute("data-tid");
        if (!tid) return;
        fetch("/api/likes?target_id=" + encodeURIComponent(tid)).then(function(res) {
            return res.json().then(function(j) {
                if (!res.ok || !j || typeof j.count !== "number") throw new Error("likes failed");
                paint(btn, j.count, likedSet().indexOf(tid) !== -1);
            });
        }).catch(function() {
            paint(btn, parseInt((btn.textContent || "0").replace(/\D/g, ""), 10) || 0, likedSet().indexOf(tid) !== -1);
        });
    }
    document.querySelectorAll(".like-btn").forEach(refresh);
    document.addEventListener("click", function(e) {
        var btn = e.target.closest ? e.target.closest(".like-btn") : null;
        if (!btn || !btn.isConnected) return;
        var tid = btn.getAttribute("data-tid");
        if (!tid) return;
        e.preventDefault();
        var on = likedSet().indexOf(tid) === -1;
        var url = "/api/likes" + (on ? "" : "?target_id=" + encodeURIComponent(tid));
        fetch(url, {
            method: on ? "POST" : "DELETE",
            headers: { "Content-Type": "application/json" },
            body: on ? JSON.stringify({ target_id: tid }) : undefined
        }).then(function(res) {
            return res.json().then(function(j) {
                if (!res.ok || !j || typeof j.count !== "number") throw new Error("likes failed");
                setLiked(tid, on);
                paint(btn, j.count, on);
            });
        }).catch(function() {});
    });
})();

// Share: copy the post's thread link to clipboard
(function postShare() {
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(function() { return true; }, function() { return false; });
        }
        return new Promise(function(resolve) {
            try {
                var ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                var ok = document.execCommand("copy");
                ta.remove();
                resolve(!!ok);
            } catch (e) { resolve(false); }
        });
    }
    document.addEventListener("click", function(e) {
        var btn = e.target.closest ? e.target.closest(".share-btn") : null;
        if (!btn || !btn.isConnected) return;
        var tid = btn.getAttribute("data-tid");
        if (!tid) return;
        e.preventDefault();
        var url = new URL("comments.html?id=" + tid, location.href).href;
        var original = btn.innerHTML;
        copyText(url).then(function(ok) {
            btn.innerHTML = ok ? "Copied ✓" : "Copy failed";
            setTimeout(function() { if (btn.isConnected) btn.innerHTML = original; }, 1500);
        });
    });
})();

// Composer avatar: pickable picture, persisted in localStorage (real avatar comes with login later)
(function composerAvatar() {
    try {
        var img = document.getElementById("composer-avatar");
        var input = document.getElementById("avatar-upload");
        if (!img || !input) return;
        var saved = localStorage.getItem("cm-avatar");
        if (saved) img.src = saved;
        input.addEventListener("change", function() {
            var file = input.files && input.files[0];
            if (!file) return;
            img.src = URL.createObjectURL(file);
            var rd = new FileReader();
            rd.onload = function() {
                try { localStorage.setItem("cm-avatar", rd.result); } catch (e) {}
            };
            try { rd.readAsDataURL(file); } catch (e) {}
            input.value = "";
        });
    } catch (e) {}
})();

// TEMP FOR TESTING: publish composer posts into the feed (persisted in localStorage)
(function tempPosting() {
    try {
        var feed = document.querySelector(".threads .n2");
        var postBtn = document.querySelector(".c-postconfig .post-btn");
        var nameInput = document.getElementById("composer-name");
        var tagInput = document.getElementById("composer-tag");
        var textInput = document.getElementById("composer-text");
        var counter = document.getElementById("char-count");
        var avatarImg = document.getElementById("composer-avatar");
        var thumbBox = document.getElementById("images-container");
        if (!feed || !postBtn || !textInput) return;

        function esc(s) {
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function linkify(s) {
            return esc(s).replace(/(https?:\/\/[^\s<>"']+)/g, '<a href="$1" target="_blank" class="post-link">$1</a>');
        }
        function getPosts() {
            try {
                var a = JSON.parse(localStorage.getItem("cm-feed-posts") || "[]");
                return Array.isArray(a) ? a : [];
            } catch (e) { return []; }
        }
        function savePosts(a) {
            try { localStorage.setItem("cm-feed-posts", JSON.stringify(a)); } catch (e) {}
        }
        function getThreads() {
            try {
                var o = JSON.parse(localStorage.getItem("cm-user-threads") || "{}");
                return (o && typeof o === "object") ? o : {};
            } catch (e) { return {}; }
        }
        function isMine(id) {
            try { return (JSON.parse(localStorage.getItem("cm-my-posts") || "[]")).indexOf(id) !== -1; }
            catch (e) { return false; }
        }
        function claimId(id) {
            try {
                var list = JSON.parse(localStorage.getItem("cm-my-posts") || "[]");
                if (list.indexOf(id) === -1) list.push(id);
                localStorage.setItem("cm-my-posts", JSON.stringify(list));
            } catch (e) {}
        }
        function replyCount(tid) {
            try {
                var all = JSON.parse(localStorage.getItem("cm-thread-replies-" + tid) || "[]");
                return Array.isArray(all) ? all.length : 0;
            } catch (e) { return 0; }
        }
        window.attachFeedDelete = function(wrap) {
            var d = wrap._d;
            if (!d) return;
            var mBtnRef = wrap.querySelector(".post-menu-btn");
            if (!mBtnRef || wrap.querySelector(".post-del")) return;
            if (!(isMine(d.id) || (d.user_id && window.cmMe && d.user_id === window.cmMe.id))) return;
            var del = document.createElement("button");
            del.type = "button";
            del.className = "post-del";
            del.textContent = "delete";
            del.addEventListener("click", function(e) {
                e.preventDefault();
                if (!confirm("Delete this post?")) return;
                function forgetLocal() {
                    try {
                        savePosts(getPosts().filter(function(p) { return p.id !== d.id; }));
                        var th = getThreads();
                        delete th[d.id];
                        localStorage.setItem("cm-user-threads", JSON.stringify(th));
                        localStorage.removeItem("cm-thread-replies-" + d.id);
                        var mine = [];
                        try { mine = JSON.parse(localStorage.getItem("cm-my-posts") || "[]"); } catch (e2) {}
                        localStorage.setItem("cm-my-posts", JSON.stringify(mine.filter(function(x) { return x !== d.id; })));
                    } catch (e2) {}
                    wrap.remove();
                }
                var isLocal = getPosts().some(function(p) { return p && p.id === d.id; });
                if (isLocal) { forgetLocal(); return; }
                fetch("/api/threads/" + encodeURIComponent(d.id), {
                    method: "DELETE",
                    headers: cmAuthHeaders()
                }).then(function(res) {
                    return res.json().then(function(j) {
                        if (!res.ok || !j || j.success !== true) throw new Error((j && j.error) || "delete failed");
                    });
                }).then(function() { forgetLocal(); }, function(err) { alert("Delete failed (" + (err && err.message ? err.message : "server unreachable") + ")."); });
            });
            wrap.insertBefore(del, mBtnRef);
        };
        window.refreshFeedDelete = function() {
            document.querySelectorAll(".threads .n2 .community-post").forEach(function(w) {
                if (w._d) window.attachFeedDelete(w);
            });
        };
        function buildPost(d) {
            var uid = "m" + d.id;
            var wrap = document.createElement("div");
            wrap.className = "community-post";
            var tagHtml = d.tag ? ' <span class="tag">#' + esc(String(d.tag).replace(/^#/, "")) + '</span>' : "";
            var imgsHtml = (d.images || []).map(function(src) {
                return '<img src="' + src + '" class="post-media" alt="post image" onerror="this.style.display=\'none\'">';
            }).join("");
            wrap.innerHTML =
                '<img src="' + d.avatar + '" class="c-post-avatar" alt="avatar">' +
                '<button type="button" class="post-menu-btn" id="post-menu-btn-' + uid + '">⋯</button>' +
                '<div class="post-menu" id="post-menu-' + uid + '"><ul>' +
                '<li><a href="#" id="post-report-' + uid + '">Report</a></li>' +
                '<li><a href="#" id="post-hide-' + uid + '">Hide</a></li></ul></div>' +
                '<div class="post-body"><div class="community-post-details">' +
                '<span class="author">' + esc(d.name) + '</span>' +
                '<span class="time">· ' + esc(d.time) + ' ·</span>' + tagHtml +
                '</div><p class="post-text" dir="auto">' + linkify(d.text) + '</p>' +
                '<div class="post-images">' + imgsHtml + '</div>' +
                '<div class="post-actions">' +
                '<a href="comments.html?id=' + d.id + '" class="post-action-link"><img src="assets/icon-comment.svg" alt="comments"> ' + replyCount(d.id) + '</a>' +
                '<span class="share-btn" data-tid="' + d.id + '"><img src="assets/icon-share.svg" alt="shares"> 0</span>' +
                '<span class="like-btn" data-tid="' + d.id + '"><img src="assets/icon-like.svg" alt="likes"> 0</span>' +
                '</div></div>';
            var mBtn = wrap.querySelector("#post-menu-btn-" + uid);
            var menu = wrap.querySelector("#post-menu-" + uid);
            var rep = wrap.querySelector("#post-report-" + uid);
            var hid = wrap.querySelector("#post-hide-" + uid);
            if (mBtn && menu) {
                mBtn.addEventListener("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    menu.style.display = (menu.style.display === "block") ? "none" : "block";
                });
                document.addEventListener("click", function(e) {
                    if (!e.target.closest || (!e.target.closest("#" + mBtn.id) && !e.target.closest("#" + menu.id))) menu.style.display = "none";
                });
            }
            if (rep) rep.addEventListener("click", function(e) {
                e.preventDefault();
                rep.textContent = "Reported ✓";
                if (menu) menu.style.display = "none";
            });
            if (hid) hid.addEventListener("click", function(e) {
                e.preventDefault();
                if (menu) menu.style.display = "none";
                var bar = document.createElement("div");
                bar.className = "post-hidden-bar";
                bar.innerHTML = '<span>Post hidden.</span> <a href="#" class="unhide-link">Undo</a>';
                wrap.replaceWith(bar);
                bar.querySelector(".unhide-link").addEventListener("click", function(ev) {
                    ev.preventDefault();
                    bar.replaceWith(wrap);
                });
            });
            wrap._d = d;
            wrap.setAttribute("data-uid", d.user_id || "");
            window.attachFeedDelete(wrap);
            var tagEl = wrap.querySelector(".tag");
            if (tagEl) tagEl.addEventListener("click", function() {
                var sb = document.querySelector("#search");
                var t = tagEl.innerText.trim();
                if (sb) sb.value = t;
                if (typeof filterPosts === "function") filterPosts(t);
            });
            if (typeof window.wirePostGallery === "function") window.wirePostGallery(wrap);
            return wrap;
        }

        getPosts().forEach(function(p) { if (p && p.id) claimId(p.id); });
        Object.keys(getThreads()).forEach(function(k) { claimId(k); });
        getPosts().slice().reverse().forEach(function(d) {
            feed.insertBefore(buildPost(d), feed.firstChild);
        });

        function fmtFeedTime(ts) {
            try {
                var d = Math.max(0, Math.floor(Date.now() / 1000) - (ts || 0));
                if (d < 60) return "just now";
                if (d < 3600) return Math.floor(d / 60) + " min ago";
                if (d < 86400) return Math.floor(d / 3600) + " hours ago";
                return new Date(ts * 1000).toLocaleDateString();
            } catch (e) { return ""; }
        }
        fetch("/api/feed?board=c").then(function(res) {
            return res.json().then(function(j) {
                if (!res.ok || !j || !Array.isArray(j.threads)) throw new Error("feed failed");
                return j.threads;
            });
        }).then(function(threads) {
            threads.slice().reverse().forEach(function(t) {
                if (!t || !t.id || feed.querySelector('[data-thread-node="' + t.id + '"]')) return;
                var node = buildPost({
                    id: t.id,
                    name: t.author || "Anonymous",
                    tag: "",
                    text: t.text || "",
                    avatar: "assets/Cpezc.png",
                    time: fmtFeedTime(t.created_at),
                    images: t.images || [],
                    replies: t.replies || 0,
                    user_id: t.user_id || null
                });
                node.setAttribute("data-thread-node", t.id);
                var link = node.querySelector(".post-action-link");
                if (link) {
                    link.lastChild.textContent = " " + (t.replies || 0);
                    link.setAttribute("data-synced", "1");
                }
                var likeBtn = node.querySelector(".like-btn");
                if (likeBtn && likeBtn.lastChild) likeBtn.lastChild.textContent = " " + (t.likes || 0);
                feed.insertBefore(node, feed.firstChild);
            });
        }).catch(function() {});

        postBtn.addEventListener("click", function() {
            if (postBtn.disabled) return;
            var text = textInput.value.trim();
            var files = uploadedFiles.slice();
            if (!text && !files.length) return;
            var tooBig = files.filter(function(f) { return f.type === "image/gif" && f.size > 10 * 1024 * 1024; });
            if (tooBig.length) {
                alert("GIF over 10MB can't be uploaded — it was removed. The rest will post.");
                files = files.filter(function(f) { return !(f.type === "image/gif" && f.size > 10 * 1024 * 1024); });
                if (!text && !files.length) return;
            }
            postBtn.disabled = true;
            var btnLabel = postBtn.textContent;
            postBtn.textContent = files.length ? "Uploading…" : "Posting…";
            var imgIssues = [];
            var imgFailed = [];
            function unlockBtn() { postBtn.disabled = false; postBtn.textContent = btnLabel; }
            function withTimeout(promise, ms) {
                return new Promise(function(resolve, reject) {
                    var done = false;
                    var timer = setTimeout(function() { if (!done) { done = true; reject(new Error("timeout")); } }, ms);
                    promise.then(function(v) { if (!done) { done = true; clearTimeout(timer); resolve(v); } }, function(e) { if (!done) { done = true; clearTimeout(timer); reject(e); } });
                });
            }
            var threads = getThreads();
            var d = {
                id: (Math.random().toString(16).slice(2) + "00000000").slice(0, 8),
                name: (nameInput && nameInput.value.trim()) || "Anonymous",
                tag: (tagInput && tagInput.value.trim()) || "",
                text: text,
                avatar: (function() { try { return localStorage.getItem("cm-avatar") || null; } catch (e) { return null; } })() || (avatarImg && avatarImg.getAttribute("src")) || "assets/Cpezc.png",
                time: "just now",
                images: []
            };
            function processImage(file) {
                return new Promise(function(resolve) {
                    if (file.type === "image/gif") {
                        var grd = new FileReader();
                        grd.onload = function() { resolve({ blob: file, local: grd.result, name: file.name || "upload.gif" }); };
                        grd.onerror = function() { resolve(null); };
                        grd.readAsDataURL(file);
                        return;
                    }
                    var url = URL.createObjectURL(file);
                    var im = new Image();
                    im.onload = function() {
                        try {
                            var max = 1600;
                            var sc = Math.min(1, max / Math.max(im.width, im.height));
                            var cw = Math.max(1, Math.round(im.width * sc));
                            var ch = Math.max(1, Math.round(im.height * sc));
                            var cv = document.createElement("canvas");
                            cv.width = cw;
                            cv.height = ch;
                            cv.getContext("2d").drawImage(im, 0, 0, cw, ch);
                            URL.revokeObjectURL(url);
                            cv.toBlob(function(b) {
                                resolve(b ? { blob: b, local: cv.toDataURL("image/jpeg", 0.85), name: "upload.jpg" } : null);
                            }, "image/jpeg", 0.85);
                        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
                    };
                    im.onerror = function() { URL.revokeObjectURL(url); resolve(null); };
                    im.src = url;
                });
            }
            function uploadToApi(item) {
                var fd = new FormData();
                fd.append("file", item.blob, item.name);
                return fetch("/api/upload", { method: "POST", body: fd }).then(function(res) {
                    return res.json().then(function(j) {
                        if (!res.ok || !j || !j.url || j.url.indexOf("http") !== 0) throw new Error((j && j.error) || "upload failed");
                        return j.url;
                    });
                });
            }
            function clearComposer() {
                textInput.value = "";
                if (counter) counter.textContent = "0/2000";
                if (thumbBox) thumbBox.innerHTML = "";
                uploadedFiles = [];
                unlockBtn();
                textInput.focus();
            }
            function publishLocal() {
                claimId(d.id);
                threads[d.id] = { id: d.id, author: d.name, time: d.time, avatar: d.avatar, images: d.images.slice(), text: text };
                var ok = true;
                try {
                    localStorage.setItem("cm-user-threads", JSON.stringify(threads));
                    var posts = getPosts();
                    posts.unshift(d);
                    savePosts(posts);
                } catch (e) { ok = false; }
                if (!ok) {
                    try {
                        threads[d.id].images = [];
                        d.images = [];
                        localStorage.setItem("cm-user-threads", JSON.stringify(threads));
                        var posts2 = getPosts();
                        posts2.unshift(d);
                        savePosts(posts2);
                        alert("Image too large for local test storage — posted as text only.");
                    } catch (e2) {
                        alert("Storage full — could not save post.");
                        unlockBtn();
                        return;
                    }
                }
                feed.insertBefore(buildPost(d), feed.firstChild);
                clearComposer();
            }
            function publish() {
                postBtn.textContent = "Posting…";
                if (imgFailed.length) {
                    alert("Upload failed for: " + imgFailed.join(", ") + ". Post blocked — images must upload first.");
                    unlockBtn();
                    return;
                }
                if (imgIssues.length) alert("Image note: " + imgIssues.join("; ") + ".");
                fetch("/api/threads", {
                    method: "POST",
                    headers: cmAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ board: "c", author: d.name, text: text, images: d.images })
                }).then(function(res) {
                    return res.json().then(function(j) {
                        if (!res.ok || !j || !j.thread) throw new Error((j && j.error) || "post failed");
                        return j.thread;
                    });
                }).then(function(t) {
                    claimId(t.id);
                    if (t.images_dropped > 0) alert(t.images_dropped + " image(s) rejected by server.");
                    feed.insertBefore(buildPost({
                        id: t.id, name: t.author, tag: d.tag, text: t.text,
                        avatar: d.avatar, time: "just now", images: t.images, replies: 0
                    }), feed.firstChild);
                    clearComposer();
                }, function() { publishLocal(); });
            }
            if (files.length > 4) {
                alert("Only the first 4 images are kept.");
                files = files.slice(0, 4);
            }
            if (!files.length) { publish(); return; }
            var pending = files.length;
            files.forEach(function(f) {
                withTimeout(processImage(f), 30000).then(function(item) {
                    if (!item) { imgFailed.push("an image (processing failed)"); if (--pending === 0) publish(); return; }
                    withTimeout(uploadToApi(item), 60000).then(function(url) {
                        d.images.push(url);
                        if (--pending === 0) publish();
                    }, function() {
                        imgFailed.push(item.name || "image");
                        if (--pending === 0) publish();
                    });
                }, function() {
                    imgFailed.push("an image (processing timed out)");
                    if (--pending === 0) publish();
                });
            });
        });
    } catch (e) {}
})();




