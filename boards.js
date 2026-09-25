// Board pages (board.html): cards/compact thread browser + thread modal.
// Runs alongside app.js (shared session, gallery, likes, sync). Does not touch /c/.

(function boardPage() {
    try {
        var boardNames = { c: "Community", a: "Anime", m: "Manga", d: "Discussion", th: "Theories", g: "General", nws: "News" };
        var boardTag = { c: "/c/", a: "/anime/", m: "/manga/", d: "/discussion/", th: "/theories/", g: "/general/", nws: "/news/" };
        // each board is its own world: only its own posts are ever fetched or shown
        var feedEl = document.querySelector(".bthreads .bn2");
        if (!feedEl) return;

        var board = "a";
        try {
            var attr = document.body.getAttribute("data-board");
            if (attr && boardNames[attr]) board = attr;
        } catch (e) {}
        try {
            var qb = new URLSearchParams(location.search).get("board");
            if (qb && boardNames[qb]) board = qb;
        } catch (e) {}

        var view = "cards";
        try {
            var sv = localStorage.getItem("cm-feed-view");
            if (sv === "compact" || sv === "cards") view = sv;
        } catch (e) {}

        var threads = [];

        function esc(s) {
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function fmtCount(n) {
            n = n || 0;
            if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
            return "" + n;
        }
        function fmtTime(ts) {
            try {
                var d = Math.max(0, Math.floor(Date.now() / 1000) - (ts || 0));
                if (d < 60) return "just now";
                if (d < 3600) return Math.floor(d / 60) + " min ago";
                if (d < 86400) return Math.floor(d / 3600) + " hours ago";
                return new Date(ts * 1000).toLocaleDateString();
            } catch (e) { return ""; }
        }
        function threadTitle(t) {
            if (t.subject) return t.subject;
            var words = String(t.text || "").trim().split(/\s+/).slice(0, 8).join(" ");
            return words ? words + " …" : "(no title)";
        }
        function parseTagList(s) {
            return String(s || "").split(",").map(function(x) {
                return x.replace(/^#/, "").trim().slice(0, 24);
            }).filter(Boolean).slice(0, 5);
        }
        function myPosts() {
            try {
                var a = JSON.parse(localStorage.getItem("cm-my-posts") || "[]");
                return Array.isArray(a) ? a : [];
            } catch (e) { return []; }
        }
        function claimId(id) {
            try {
                var list = myPosts();
                if (list.indexOf(id) === -1) list.push(id);
                localStorage.setItem("cm-my-posts", JSON.stringify(list));
            } catch (e) {}
        }
        function isMine(id) {
            if (myPosts().indexOf(id) !== -1) return true;
            var uid = null;
            try {
                var el = document.querySelector('.bthreads [data-thread-node="' + id + '"]');
                uid = el && el.getAttribute("data-uid");
            } catch (e) {}
            return !!(uid && window.cmMe && uid === window.cmMe.id);
        }
        function replyCount(tid) {
            try {
                var all = JSON.parse(localStorage.getItem("cm-thread-replies-" + tid) || "[]");
                return Array.isArray(all) ? all.length : 0;
            } catch (e) { return 0; }
        }
        function isLikedLocal(tid) {
            try { return (JSON.parse(localStorage.getItem("cm-liked") || "[]")).indexOf(tid) !== -1; }
            catch (e) { return false; }
        }
        function chipsHtml(tags) {
            return (Array.isArray(tags) ? tags : []).slice(0, 5).map(function(t) {
                t = String(t).replace(/^#/, "");
                return '<span class="tag">#' + esc(t) + "</span>";
            }).join("");
        }
        function firstImage(t) {
            return (t.images && t.images[0]) || "";
        }
        function tagFor() {
            return boardTag[board] || ("/" + board + "/");
        }
        function snippetOf(t) {
            var s = String(t.text || "").trim().replace(/\s+/g, " ");
            return s.length > 140 ? s.slice(0, 140) + "…" : s;
        }
        function actionsBar(t, replies) {
            return '<div class="post-actions">' +
                '<a href="comments.html?id=' + t.id + '" class="post-action-link"><img src="assets/icon-comment.svg" alt="comments"> ' + replies + '</a>' +
                '<span class="share-btn" data-tid="' + t.id + '"><img src="assets/icon-share.svg" alt="shares"> 0</span>' +
                '<span class="like-btn' + (isLikedLocal(t.id) ? " liked" : "") + '" data-tid="' + t.id + '"><img src="assets/icon-like.svg" alt="likes"> ' + (t.likes || 0) + "</span>" +
                "</div>";
        }
        function cardMenu(t) {
            var uid = "b" + t.id;
            return '<button type="button" class="post-menu-btn" id="post-menu-btn-' + uid + '">⋯</button>' +
                '<div class="post-menu" id="post-menu-' + uid + '"><ul>' +
                '<li><a href="#" id="post-report-' + uid + '">Report</a></li>' +
                '<li><a href="#" id="post-hide-' + uid + '">Hide</a></li></ul></div>';
        }
        function wireNode(wrap, t) {
            var uid = "b" + t.id;
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
            wrap.setAttribute("data-uid", t.user_id || "");
            wrap.setAttribute("data-thread-node", t.id);
            if (isMine(t.id)) {
                var mBtnRef = wrap.querySelector(".post-menu-btn");
                if (mBtnRef && !wrap.querySelector(".post-del")) {
                    var del = document.createElement("button");
                    del.type = "button";
                    del.className = "post-del";
                    del.textContent = "delete";
                    del.addEventListener("click", function(e) {
                        e.preventDefault();
                        if (!confirm("Delete this post?")) return;
                        var headers = {};
                        try {
                            var tok = localStorage.getItem("cm-session");
                            if (tok) headers["Authorization"] = "Bearer " + tok;
                        } catch (e2) {}
                        fetch("/api/threads/" + encodeURIComponent(t.id), { method: "DELETE", headers: headers }).then(function(res) {
                            return res.json().then(function(j) {
                                if (!res.ok || !j || j.success !== true) throw new Error((j && j.error) || "delete failed");
                            });
                        }).then(function() { wrap.remove(); }, function(err) { alert("Delete failed (" + (err && err.message ? err.message : "server unreachable") + ")."); });
                    });
                    wrap.insertBefore(del, mBtnRef);
                }
            }
            wrap.querySelectorAll(".tag").forEach(function(tagEl) {
                tagEl.addEventListener("click", function() {
                    var sb = document.getElementById("board-search");
                    var box = document.getElementById("search");
                    var t2 = "#" + tagEl.innerText.trim().replace(/^#/, "");
                    if (sb) sb.value = t2;
                    else if (box) box.value = t2;
                    if (typeof filterPosts === "function") filterPosts(t2);
                });
            });
            if (typeof window.wirePostGallery === "function") window.wirePostGallery(wrap);
        }
        function buildCard(t) {
            var img = firstImage(t);
            var replies = (t.replies != null ? t.replies : replyCount(t.id));
            var wrap = document.createElement("div");
            wrap.className = "feed-card";
            wrap.innerHTML =
                (img ? '<a href="comments.html?id=' + t.id + '" class="feed-thumb"><img src="' + img + '" class="post-media" alt="post image" onerror="this.style.display=\'none\'"></a>' : "") +
                '<div class="feed-card-main">' +
                '<div class="feed-card-top"><span class="board-tag">' + esc(tagFor()) + "</span>" +
                '<span class="thread-time">' + esc(t.time || fmtTime(t.created_at)) + "</span></div>" +
                '<a href="comments.html?id=' + t.id + '" class="feed-title">' + esc(threadTitle(t)) + "</a>" +
                '<div class="feed-author">' + esc(t.author || "Anonymous") + "</div>" +
                '<p class="feed-snippet">' + esc(snippetOf(t)) + "</p>" +
                '<div class="feed-chips">' + chipsHtml(t.tags) + "</div>" +
                '<div class="feed-foot">' + actionsBar(t, replies) + "</div>" +
                "</div>" + cardMenu(t);
            wireNode(wrap, t);
            return wrap;
        }
        function buildCompact(t) {
            var img = firstImage(t);
            var replies = (t.replies != null ? t.replies : replyCount(t.id));
            var wrap = document.createElement("div");
            wrap.className = "feed-row";
            wrap.innerHTML =
                (img ? '<a href="comments.html?id=' + t.id + '" class="feed-thumb"><img src="' + img + '" class="post-media" alt="post image" onerror="this.style.display=\'none\'"></a>' : "") +
                '<div class="feed-row-main">' +
                '<div class="feed-card-top"><span class="board-tag">' + esc(tagFor()) + "</span>" +
                '<span class="thread-time">' + esc(t.time || fmtTime(t.created_at)) + "</span></div>" +
                '<a href="comments.html?id=' + t.id + '" class="feed-title">' + esc(threadTitle(t)) + "</a>" +
                '<div class="feed-author">' + esc(t.author || "Anonymous") + "</div>" +
                '<p class="feed-snippet">' + esc(snippetOf(t)) + "</p>" +
                '<div class="feed-chips">' + chipsHtml(t.tags) + "</div>" +
                "</div>" +
                '<div class="feed-row-side">' + actionsBar(t, replies) + "</div>" +
                cardMenu(t);
            wireNode(wrap, t);
            return wrap;
        }
        function renderBoard() {
            feedEl.classList.toggle("feed-cards", view !== "compact");
            feedEl.classList.toggle("feed-list", view === "compact");
            feedEl.innerHTML = "";
            var seen = {};
            threads.forEach(function(t) {
                if (!t || !t.id || seen[t.id]) return;
                seen[t.id] = 1;
                feedEl.appendChild(view === "compact" ? buildCompact(t) : buildCard(t));
            });
            var vc = document.getElementById("view-cards");
            if (vc) { vc.classList.toggle("active", view !== "compact"); vc.setAttribute("aria-pressed", view !== "compact" ? "true" : "false"); }
            var vp = document.getElementById("view-compact");
            if (vp) { vp.classList.toggle("active", view === "compact"); vp.setAttribute("aria-pressed", view === "compact" ? "true" : "false"); }
            var bt = document.getElementById("board-title");
            if (bt) bt.textContent = boardNames[board] || board;
            document.title = "Katsura - " + (boardNames[board] || board);
            var bs = document.getElementById("composer-board");
            if (bs && bs.querySelector('option[value="' + board + '"]')) bs.value = board;
        }
        function setView(v) {
            view = (v === "compact") ? "compact" : "cards";
            try { localStorage.setItem("cm-feed-view", view); } catch (e) {}
            renderBoard();
        }
        function localBoardPosts() {
            try {
                var o = JSON.parse(localStorage.getItem("cm-board-threads") || "{}");
                return Object.keys(o).map(function(k) { return o[k]; }).filter(function(t) {
                    return t && t.id && (t.board || board) === board;
                });
            } catch (e) { return []; }
        }
        function loadBoard() {
            fetch("/api/feed?board=" + encodeURIComponent(board)).then(function(res) {
                return res.json().then(function(j) {
                    if (!res.ok || !j || !Array.isArray(j.threads)) throw new Error("feed failed");
                    return j.threads;
                });
            }).then(function(list) {
                threads = mergeLocal(list);
                renderBoard();
            }).catch(function() {
                threads = mergeLocal([]);
                renderBoard();
            });
        }
        function mergeLocal(list) {
            var seen = {};
            var out = [];
            list.forEach(function(t) {
                if (t && t.id && (t.board || board) === board && !seen[t.id]) { seen[t.id] = 1; out.push(t); }
            });
            localBoardPosts().forEach(function(t) {
                if (!seen[t.id]) { seen[t.id] = 1; out.push(t); }
            });
            return out;
        }
        var vcBtn = document.getElementById("view-cards");
        if (vcBtn) vcBtn.addEventListener("click", function() { setView("cards"); });
        var vpBtn = document.getElementById("view-compact");
        if (vpBtn) vpBtn.addEventListener("click", function() { setView("compact"); });

        function openModal() {
            var m = document.getElementById("thread-modal");
            if (m) { m.hidden = false; }
        }
        function closeModal() {
            var m = document.getElementById("thread-modal");
            if (m) m.hidden = true;
        }
        var ntBtn = document.getElementById("new-thread-btn");
        if (ntBtn) ntBtn.addEventListener("click", openModal);
        var mcBtn = document.getElementById("modal-close");
        if (mcBtn) mcBtn.addEventListener("click", closeModal);
        var mCancel = document.getElementById("modal-cancel");
        if (mCancel) mCancel.addEventListener("click", closeModal);
        var tModal = document.getElementById("thread-modal");
        if (tModal) tModal.addEventListener("click", function(e) { if (e.target === tModal) closeModal(); });
        document.addEventListener("keydown", function(e) {
            var m = document.getElementById("thread-modal");
            if (e.key === "Escape" && m && !m.hidden) closeModal();
        });

        var bText = document.getElementById("composer-text");
        var bCount = document.getElementById("b-count");
        if (bText && bCount) bText.addEventListener("input", function() {
            bCount.textContent = bText.value.length + "/2000";
        });
        var bFiles = [];
        var bFileInput = document.getElementById("b-file-upload");
        var bImages = document.getElementById("b-images");
        if (bFileInput && bImages) bFileInput.addEventListener("change", function(e) {
            Array.from(e.target.files).forEach(function(file) {
                bFiles.push(file);
                var img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.title = "Click to remove";
                img.addEventListener("click", function() {
                    bFiles = bFiles.filter(function(f) { return f !== file; });
                    img.remove();
                });
                bImages.appendChild(img);
            });
            bFileInput.value = "";
        });
        function bProcessImage(file) {
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
        function bUploadToApi(item) {
            var fd = new FormData();
            fd.append("file", item.blob, item.name);
            return fetch("/api/upload", { method: "POST", body: fd }).then(function(res) {
                return res.json().then(function(j) {
                    if (!res.ok || !j || !j.url || j.url.indexOf("http") !== 0) throw new Error((j && j.error) || "upload failed");
                    return j.url;
                });
            });
        }
        function bWithTimeout(promise, ms) {
            return new Promise(function(resolve, reject) {
                var done = false;
                var timer = setTimeout(function() { if (!done) { done = true; reject(new Error("timeout")); } }, ms);
                promise.then(function(v) { if (!done) { done = true; clearTimeout(timer); resolve(v); } }, function(e) { if (!done) { done = true; clearTimeout(timer); reject(e); } });
            });
        }
        var bPostBtn = document.getElementById("modal-post");
        if (bPostBtn && bText) bPostBtn.addEventListener("click", function() {
            if (bPostBtn.disabled) return;
            var text = bText.value.trim();
            var files = bFiles.slice();
            if (!text && !files.length) return;
            var tooBig = files.filter(function(f) { return f.type === "image/gif" && f.size > 10 * 1024 * 1024; });
            if (tooBig.length) {
                alert("GIF over 10MB can't be uploaded — it was removed. The rest will post.");
                files = files.filter(function(f) { return !(f.type === "image/gif" && f.size > 10 * 1024 * 1024); });
                if (!text && !files.length) return;
            }
            if (files.length > 4) {
                alert("Only the first 4 images are kept.");
                files = files.slice(0, 4);
            }
            bPostBtn.disabled = true;
            bPostBtn.textContent = files.length ? "Uploading…" : "Posting…";
            function unlockBtn() { bPostBtn.disabled = false; bPostBtn.textContent = "Post Thread"; }
            function clearForm() {
                bText.value = "";
                var subj = document.getElementById("composer-subject");
                if (subj) subj.value = "";
                if (bCount) bCount.textContent = "0/2000";
                if (bImages) bImages.innerHTML = "";
                bFiles = [];
                unlockBtn();
            }
            var nameEl = document.getElementById("composer-name");
            var tagEl = document.getElementById("composer-tag");
            var bsEl = document.getElementById("composer-board");
            var subjEl = document.getElementById("composer-subject");
            var d = {
                id: (Math.random().toString(16).slice(2) + "00000000").slice(0, 8),
                name: (nameEl && nameEl.value.trim()) || (window.cmMe && window.cmMe.name) || "Anonymous",
                board: (bsEl && bsEl.value) || board,
                subject: subjEl ? subjEl.value.trim().slice(0, 120) : "",
                tags: parseTagList(tagEl ? tagEl.value : ""),
                text: text,
                avatar: "assets/Cpezc.png",
                time: "just now",
                images: []
            };
            function publish() {
                bPostBtn.textContent = "Posting…";
                if (failed.length) {
                    alert("Upload failed for: " + failed.join(", ") + ". Post blocked — images must upload first.");
                    unlockBtn();
                    return;
                }
                bPostBtn.textContent = "Posting…";
                var headers = { "Content-Type": "application/json" };
                try {
                    var tok = localStorage.getItem("cm-session");
                    if (tok) headers["Authorization"] = "Bearer " + tok;
                } catch (e) {}
                fetch("/api/threads", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ board: d.board, author: d.name, subject: d.subject, tags: d.tags, text: text, images: d.images })
                }).then(function(res) {
                    return res.json().then(function(j) {
                        if (!res.ok || !j || !j.thread) throw new Error((j && j.error) || "post failed");
                        return j.thread;
                    });
                }).then(function(t) {
                    claimId(t.id);
                    if (t.images_dropped > 0) alert(t.images_dropped + " image(s) rejected by server.");
                    closeModal();
                    clearForm();
                    loadBoard();
                }, function() {
                    try {
                        var all = JSON.parse(localStorage.getItem("cm-board-threads") || "{}");
                        all[d.id] = { id: d.id, board: d.board, author: d.name, subject: d.subject, tags: d.tags, time: d.time, avatar: d.avatar, images: d.images.slice(), text: text };
                        localStorage.setItem("cm-board-threads", JSON.stringify(all));
                    } catch (e) {}
                    claimId(d.id);
                    closeModal();
                    clearForm();
                    loadBoard();
                });
            }
            function parseTagList(s) {
                return String(s || "").split(",").map(function(x) {
                    return x.replace(/^#/, "").trim().slice(0, 24);
                }).filter(Boolean).slice(0, 5);
            }
            if (!files.length) { publish(); return; }
            var pending = files.length;
            var failed = [];
            var failed = [];
            files.forEach(function(f) {
                bWithTimeout(bProcessImage(f), 30000).then(function(item) {
                    if (!item) { failed.push("an image"); if (--pending === 0) publish(); return; }
                    bWithTimeout(bUploadToApi(item), 60000).then(function(url) {
                        d.images.push(url);
                        if (--pending === 0) publish();
                    }, function() {
                        failed.push(item.name || "image");
                        if (--pending === 0) publish();
                    });
            }, function() {
                failed.push("an image");
                if (--pending === 0) publish();
            });
        });
        });

        loadBoard();
    } catch (e) {}
})();
