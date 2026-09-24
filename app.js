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
        function replyCount(tid) {
            try {
                var all = JSON.parse(localStorage.getItem("cm-thread-replies-" + tid) || "[]");
                return Array.isArray(all) ? all.length : 0;
            } catch (e) { return 0; }
        }
        function buildPost(d) {
            var uid = "m" + d.id;
            var wrap = document.createElement("div");
            wrap.className = "community-post";
            var tagHtml = d.tag ? ' <span class="tag">#' + esc(String(d.tag).replace(/^#/, "")) + '</span>' : "";
            var imgsHtml = (d.images || []).map(function(src) {
                return '<img src="' + src + '" class="post-media" alt="post image">';
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
                '<span><img src="assets/icon-share.svg" alt="shares"> 0</span>' +
                '<span><img src="assets/icon-like.svg" alt="likes"> 0</span>' +
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
            var mBtnRef = wrap.querySelector(".post-menu-btn");
            if (mBtnRef) {
                var del = document.createElement("button");
                del.type = "button";
                del.className = "post-del";
                del.textContent = "delete";
                del.addEventListener("click", function(e) {
                    e.preventDefault();
                    if (!confirm("Delete this post?")) return;
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
                });
                wrap.insertBefore(del, mBtnRef);
            }
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
                    replies: t.replies || 0
                });
                node.setAttribute("data-thread-node", t.id);
                var link = node.querySelector(".post-action-link");
                if (link) {
                    link.lastChild.textContent = " " + (t.replies || 0);
                    link.setAttribute("data-synced", "1");
                }
                feed.insertBefore(node, feed.firstChild);
            });
        }).catch(function() {});

        postBtn.addEventListener("click", function() {
            var text = textInput.value.trim();
            var files = uploadedFiles.slice();
            if (!text && !files.length) return;
            var threads = getThreads();
            var d = {
                id: "u" + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10),
                name: (nameInput && nameInput.value.trim()) || "Anonymous",
                tag: (tagInput && tagInput.value.trim()) || "",
                text: text,
                avatar: (avatarImg && avatarImg.getAttribute("src")) || "assets/Cpezc.png",
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
                textInput.focus();
            }
            function publishLocal() {
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
                        return;
                    }
                }
                feed.insertBefore(buildPost(d), feed.firstChild);
                clearComposer();
            }
            function publish() {
                fetch("/api/threads", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ board: "c", author: d.name, text: text, images: d.images })
                }).then(function(res) {
                    return res.json().then(function(j) {
                        if (!res.ok || !j || !j.thread) throw new Error((j && j.error) || "post failed");
                        return j.thread;
                    });
                }).then(function(t) {
                    feed.insertBefore(buildPost({
                        id: t.id, name: t.author, tag: d.tag, text: t.text,
                        avatar: d.avatar, time: "just now", images: t.images, replies: 0
                    }), feed.firstChild);
                    clearComposer();
                }, function() { publishLocal(); });
            }
            if (!files.length) { publish(); return; }
            var pending = files.length;
            files.forEach(function(f) {
                processImage(f).then(function(item) {
                    if (!item) { if (--pending === 0) publish(); return; }
                    uploadToApi(item).then(function(url) {
                        d.images.push(url);
                        if (--pending === 0) publish();
                    }, function() {
                        d.images.push(item.local);
                        if (--pending === 0) publish();
                    });
                });
            });
        });
    } catch (e) {}
})();




