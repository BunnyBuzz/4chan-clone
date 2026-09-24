// comments.html behavior: render thread by ?id, replies, quotes, counts, quick reply, lightbox.
// Shared site styles live in style.css; thread-only styles in comments.css.
function cmDeriveTitle() {
        var opText = document.querySelector(".cm-op-text");
        if (!opText) return;
        var words = opText.textContent.trim().split(/\s+/).slice(0, 8).join(" ");
        if (!words) return;
        var snippet = words + " …";
        var bar = document.querySelector(".cm-threadbar span");
        if (bar) bar.textContent = snippet;
        var crumb = document.querySelector(".cm-crumb");
        if (crumb) {
            var link = crumb.querySelector("a");
            crumb.innerHTML = "";
            if (link) crumb.appendChild(link);
            crumb.appendChild(document.createTextNode(" " + snippet));
        }
        document.title = snippet + " - Katsura";
    }
    cmDeriveTitle();
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    document.getElementById("cm-reply-btn").addEventListener("click", function() {
        document.getElementById("cm-quick").scrollIntoView({ behavior: "smooth" });
        document.getElementById("cm-quick-text").focus();
    });
    var cmQuickText = document.getElementById("cm-quick-text");
    var cmQuickCount = document.getElementById("cm-quick-count");
    if (cmQuickText && cmQuickCount) {
        cmQuickText.addEventListener("input", function() {
            cmQuickCount.textContent = cmQuickText.value.length + "/2000";
        });
    }
    function cmPostId(el) {
        var m = el.textContent.match(/ID:\s*([0-9a-f]{4,})/i);
        return m ? m[1].toLowerCase() : null;
    }
    var cmAnonN = 0;
    function cmEnsureId(post) {
        var id = cmPostId(post);
        if (!id) {
            cmAnonN++;
            id = "u" + Date.now().toString(16).slice(-4) + cmAnonN;
            var head = post.querySelector(".cm-rhead, .cm-op-user");
            if (head) {
                var s = document.createElement("span");
                s.className = "cm-meta";
                s.textContent = "ID: " + id;
                var cnt = head.querySelector(".cm-count");
                head.insertBefore(s, cnt || null);
            }
        }
        post.id = "p-" + id;
        return id;
    }
    function cmMyPosts() {
        try { return JSON.parse(localStorage.getItem("cm-my-posts") || "[]"); }
        catch (e) { return []; }
    }
    function cmIsMine(id) { return cmMyPosts().indexOf(id) !== -1; }
    function cmClaimPost(id) {
        try {
            var list = cmMyPosts();
            if (list.indexOf(id) === -1) list.push(id);
            localStorage.setItem("cm-my-posts", JSON.stringify(list));
        } catch (e) {}
    }
    (function cmClaimStored() {
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf("cm-thread-replies-") === 0) {
                    var arr = JSON.parse(localStorage.getItem(k) || "[]");
                    (Array.isArray(arr) ? arr : []).forEach(function(r) {
                        if (r && r.id) cmClaimPost(r.id);
                    });
                }
            }
        } catch (e) {}
    })();
    // Real thread data: seed mirrors the feed post; user threads/replies persist in localStorage.
    // Backend shape = future `GET /api/threads/:id` response. Swap the seed+storage reads with fetch() later.
    var SITE_THREADS = {
        "c7f3a29e": {
            id: "c7f3a29e",
            author: "Anonymous",
            time: "2m",
            tag: "#Kitsu",
            avatar: "assets/community-avatar.jpg",
            images: ["assets/test1.jpg", "assets/test2.jpg"],
            text: 'With Shima and Koriyama ""https://google.com""" having been promoted, they had been replaced in their former spots by Tadamitsu Oguri in Beijing and Takashi Yagi in Shanghai. Oguri seemed to be getting off wrong-footed when it came to people like government officials as he wouldn\'t engage in bribery and spoke bluntly in regards to issues like the Senkaku Islands, but he seemed to try and immerse himself with the common people and employees who in turn seemed to really like him. Yagi quickly made an impact in growing Shanghai Hatsushiba\'s business by instituting performance based pay but his attitude rubbed a lot of people the wrong way, including Yang and Kokubun. Because of their attitudes towards him and seeming loyalty towards Shima, he proceeded cut Yang\'s pay while moving Kokubun into a newly created company overseeing Hatsushiba\'s golf investments. At the same time he also managed to piss off Lu Sangling, their Chinese golf prodigy, by mentioning that he was her older sister\'s lover.\n\nShima also started going to a Chinese restaurant across from his condo called the Ronghua Hotel where he wound up coming to the aid of its owner, a woman named Tu Zilei who\'d come over to Japan after becoming the lover of a politician, as shew as being attacked and shaken down by her younger brother. Concerningly, too, anti-Japan sentiment started rising in China and Hatsushiba was a victim of it when a mob attacked Chufa stores damaging only the Hatsushiba product, leading Sun to pull Hatsushiba\'s products. Yang and Chen Minsheng, Kokubun\'s replacement and Yagi\'s right hand man, decided to try countering online sentiment in response.'
        }
    };
    function cmGetTid() {
        try {
            var q = new URLSearchParams(location.search).get("id");
            if (q) return q;
        } catch (e) {}
        return null;
    }
    var cmTid = cmGetTid();
    function cmThreadReplies(tid) {
        try {
            var all = JSON.parse(localStorage.getItem("cm-thread-replies-" + tid) || "[]");
            return Array.isArray(all) ? all : [];
        } catch (e) { return []; }
    }
    function cmUserThreads() {
        try {
            var o = JSON.parse(localStorage.getItem("cm-user-threads") || "{}");
            return (o && typeof o === "object") ? o : {};
        } catch (e) { return {}; }
    }
    function cmEscape(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function cmFillBody(p, text) {
        var blines = String(text || "").split("\n");
        var qhtml = "";
        while (blines.length && /^>>[0-9a-f]{4,}\s*$/i.test(blines[0])) {
            var qid = blines.shift().trim().slice(2).toLowerCase();
            if (document.getElementById("p-" + qid)) {
                qhtml += '<div class="cm-quote"><a href="#p-' + qid + '">&gt;&gt;' + qid + '</a></div>';
            } else {
                qhtml += '<div class="cm-quote">&gt;&gt;' + qid + '</div>';
            }
        }
        if (qhtml) p.insertAdjacentHTML("beforebegin", qhtml);
        var bhtml = cmLinkifyQuotes(blines.join("\n").trim());
        if (bhtml) { p.innerHTML = bhtml; } else { p.remove(); }
    }
    function cmBuildOp(t) {
        var firstImg = (t.images && t.images[0]) || "";
        var fname = firstImg ? firstImg.split("/").pop() : "";
        var paras = String(t.text || "").split(/\n\n+/).map(function(p) {
            return "<p dir=\"auto\">" + cmLinkifyUrls(cmEscape(p)) + "</p>";
        }).join("");
        var div = document.createElement("div");
        div.className = "cm-op";
        div.innerHTML =
            '<div class="cm-op-user"><input type="checkbox" aria-label="Select thread">' +
            '<span class="cm-user">' + cmEscape(t.author || "Anonymous") + '</span>' +
            '<span class="cm-meta">ID: ' + t.id + '</span>' +
            '<span class="cm-meta">' + cmEscape(t.time || "") + '</span></div>' +
            '<div class="cm-op-body"><div class="cm-op-img">' +
            (firstImg ? '<img src="' + firstImg + '" alt="Thread image"><span class="cm-filename">' + cmEscape(fname) + '</span>' : '') +
            '</div><div class="cm-op-text">' + paras + '</div>' +
            '<span class="cm-count"><img src="assets/icon-comment.svg" alt="comments"> 0</span></div>' +
            '<div class="cm-rlinks"><a href="#">#report</a></div>';
        return div;
    }
    function cmBuildReply(r) {
        var div = document.createElement("div");
        div.className = "cm-reply";
        div.setAttribute("data-rid", r.id);
        div.innerHTML = '<img class="cm-avatar" src="' + (r.avatar || "assets/Cpezc.png") + '" alt="avatar">' +
            '<div class="cm-rbody"><div class="cm-rhead"><span class="cm-user"></span>' +
            '<span class="cm-meta">ID: ' + r.id + '</span>' +
            '<span class="cm-meta">' + cmEscape(r.time || "just now") + '</span>' +
            '<span class="cm-count"><img src="assets/icon-comment.svg" alt="comments"> 0</span></div><p dir="auto"></p>' +
            '<div class="cm-rlinks"><a href="#">#report</a></div></div>';
        div.querySelector(".cm-user").textContent = r.name || "Anonymous";
        cmFillBody(div.querySelector("p"), r.text || "");
        (r.images || []).forEach(function(src) {
            var im = document.createElement("img");
            im.src = src;
            im.className = "cm-rimg";
            im.alt = "reply image";
            im.addEventListener("click", function() {
                cmLB.querySelector(".lb-img").src = im.src;
                cmLB.classList.add("open");
            });
            div.querySelector(".cm-rlinks").insertAdjacentElement("beforebegin", im);
        });
        return div;
    }
    function cmUpdateOpCount(n) {
        var el = document.querySelector("#cm-thread .cm-op .cm-count");
        if (el) el.innerHTML = '<img src="assets/icon-comment.svg" alt="comments"> ' + n;
    }
    function cmApi(path, opts) {
        return fetch(path, opts).then(function(res) {
            return res.json().then(function(j) {
                if (!res.ok || !j) throw new Error((j && j.error) || ("HTTP " + res.status));
                return j;
            });
        });
    }
    function cmFmtTime(ts) {
        try {
            var d = Math.max(0, Math.floor(Date.now() / 1000) - (ts || 0));
            if (d < 60) return "just now";
            if (d < 3600) return Math.floor(d / 60) + " min ago";
            if (d < 86400) return Math.floor(d / 3600) + " hours ago";
            return new Date(ts * 1000).toLocaleDateString();
        } catch (e) { return ""; }
    }
    function cmNormReply(r) {
        return {
            id: r.id,
            name: r.author || r.name || "Anonymous",
            text: r.text || "",
            images: r.images || [],
            time: r.time || (r.created_at ? cmFmtTime(r.created_at) : "just now"),
            avatar: r.avatar || "assets/Cpezc.png"
        };
    }
    function cmRenderRepliesFrom(all) {
        var list = document.getElementById("cm-replies");
        if (!list) return;
        list.innerHTML = "";
        if (!all.length) {
            list.innerHTML = '<p class="cm-empty">No replies yet — be the first.</p>';
            cmUpdateOpCount(0);
            return;
        }
        all.forEach(function(r) {
            var div = cmBuildReply(r);
            div.id = "p-" + r.id;
            list.appendChild(div);
            cmWirePost(div);
        });
        var refCount = {};
        all.forEach(function(r) {
            var m = String(r.text || "").match(/>>([0-9a-f]{4,})/gi) || [];
            m.forEach(function(q) {
                var qid = q.slice(2).toLowerCase();
                refCount[qid] = (refCount[qid] || 0) + 1;
            });
        });
        list.querySelectorAll(".cm-reply").forEach(function(div) {
            var rid = (div.id || "").replace(/^p-/, "");
            var cnt = div.querySelector(".cm-count");
            if (cnt) cnt.innerHTML = '<img src="assets/icon-comment.svg" alt="comments"> ' + (refCount[rid] || 0);
        });
        cmUpdateOpCount(all.length);
    }
    function cmRenderReplies() {
        cmRenderRepliesFrom(cmThreadReplies(cmTid).map(cmNormReply));
    }
    function cmRenderAll() {
        var host = document.getElementById("cm-thread");
        var list = document.getElementById("cm-replies");
        if (!host || !list) return;
        host.innerHTML = "";
        list.innerHTML = "";
        if (!cmTid) {
            host.innerHTML = '<p class="cm-empty">Thread not found. <a href="index.html">Back to feed</a></p>';
            return;
        }
        cmApi("/api/threads/" + encodeURIComponent(cmTid)).then(function(j) {
            var op = cmBuildOp({
                id: j.thread.id,
                author: j.thread.author,
                text: j.thread.text,
                images: j.thread.images,
                time: cmFmtTime(j.thread.created_at)
            });
            op.id = "p-" + j.thread.id;
            host.appendChild(op);
            cmWirePost(op);
            var api = (j.replies || []).map(cmNormReply);
            var seen = {};
            api.forEach(function(r) { seen[r.id] = 1; });
            var pending = cmThreadReplies(cmTid).map(cmNormReply).filter(function(r) { return !seen[r.id]; });
            cmRenderRepliesFrom(api.concat(pending));
            cmDeriveTitle();
        }, function() {
            var t = SITE_THREADS[cmTid] || cmUserThreads()[cmTid];
            host.innerHTML = "";
            list.innerHTML = "";
            if (!t) {
                host.innerHTML = '<p class="cm-empty">Thread not found. <a href="index.html">Back to feed</a></p>';
                return;
            }
            var op = cmBuildOp(t);
            op.id = "p-" + t.id;
            host.appendChild(op);
            cmWirePost(op);
            cmRenderReplies();
            cmDeriveTitle();
        });
    }
    function cmWirePost(post) {
        var id = cmEnsureId(post);
        var cnt = post.querySelector(".cm-count");
        if (cnt && !cnt.dataset.replyWired) {
            cnt.dataset.replyWired = "1";
            cnt.title = "Reply to this post";
            cnt.addEventListener("click", function() {
                var box = document.getElementById("cm-quick-text");
                var quick = document.getElementById("cm-quick");
                if (box && box.value.indexOf(">>" + id) === -1) box.value = ">>" + id + "\n" + box.value;
                if (quick) {
                    quick.scrollIntoView({ behavior: "smooth" });
                    quick.classList.remove("cm-flash");
                    void quick.offsetWidth;
                    quick.classList.add("cm-flash");
                }
                if (box) box.focus();
            });
        }
        var prev = cnt && cnt.previousElementSibling;
        if (cnt && cmIsMine(id) && (!prev || (prev.className || "").indexOf("cm-del") === -1)) {
            var del = document.createElement("button");
            del.type = "button";
            del.className = "cm-del";
            del.textContent = "delete";
            del.addEventListener("click", function() {
                if (!confirm("Delete this post?")) return;
                var rid = post.getAttribute("data-rid");
                if (rid && cmTid) {
                    var kept = cmThreadReplies(cmTid).filter(function(r) { return r.id !== rid; });
                    try { localStorage.setItem("cm-thread-replies-" + cmTid, JSON.stringify(kept)); } catch (e) {}
                    cmUpdateOpCount(kept.length);
                }
                post.remove();
            });
            cnt.parentNode.insertBefore(del, cnt);
        }
        return id;
    }
    cmRenderAll();
    document.querySelectorAll(".cm-quote").forEach(function(q) {
        if (q.querySelector("a")) return;
        var m = q.textContent.match(/>>\s*([0-9a-z]+)/i);
        if (!m) return;
        var a = document.createElement("a");
        a.href = "#p-" + m[1].toLowerCase();
        a.textContent = q.textContent.trim();
        q.textContent = "";
        q.appendChild(a);
    });
    document.addEventListener("click", function(e) {
        var a = e.target.closest ? e.target.closest('.cm-quote a[href^="#p-"]') : null;
        if (!a) return;
        var t = document.querySelector(a.getAttribute("href"));
        if (!t) return;
        setTimeout(function() {
            t.classList.remove("cm-flash");
            void t.offsetWidth;
            t.classList.add("cm-flash");
        }, 60);
    });
    function cmLinkifyUrls(esc) {
        return esc.replace(/(https?:\/\/[^\s<>"']+)/g, '<a class="post-link" href="$1" target="_blank" rel="noopener">$1</a>');
    }
    function cmLinkifyQuotes(text) {
        var esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var withQuotes = esc.replace(/&gt;&gt;([0-9a-f]{4,})/gi, function(m, id) {
            id = id.toLowerCase();
            if (document.getElementById("p-" + id)) {
                return '<a href="#p-' + id + '">&gt;&gt;' + id + '</a>';
            }
            return m;
        });
        return cmLinkifyUrls(withQuotes);
    }
    function cmProcessImage(file) {
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
    function cmUploadToApi(item) {
        var fd = new FormData();
        fd.append("file", item.blob, item.name);
        return fetch("/api/upload", { method: "POST", body: fd }).then(function(res) {
            return res.json().then(function(j) {
                if (!res.ok || !j || !j.url || j.url.indexOf("http") !== 0) throw new Error((j && j.error) || "upload failed");
                return j.url;
            });
        });
    }
    document.getElementById("cm-post-reply").addEventListener("click", function() {
        var box = document.getElementById("cm-quick-text");
        var text = box.value.trim();
        var files = cmFiles.slice();
        if ((!text && !files.length) || !cmTid) return;
        var nameBox = document.getElementById("cm-quick-name");
        var name = (nameBox && nameBox.value.trim()) || "Anonymous";
        var rid = Math.random().toString(16).slice(2, 10);
        var imgs = [];
        function clearForm() {
            box.value = "";
            if (cmQuickCount) cmQuickCount.textContent = "0/2000";
            document.getElementById("cm-images-container").innerHTML = "";
            cmFiles = [];
        }
        function done() {
            var payload = { author: name, text: text, images: imgs };
            cmApi("/api/threads/" + encodeURIComponent(cmTid) + "/replies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(function(j) {
                cmClaimPost(j.reply.id);
                cmRenderAll();
                clearForm();
            }, function() {
                var all = cmThreadReplies(cmTid);
                all.push({ id: rid, name: name, text: text, images: imgs, time: "just now" });
                try {
                    localStorage.setItem("cm-thread-replies-" + cmTid, JSON.stringify(all));
                } catch (e) {
                    all[all.length - 1].images = [];
                    imgs = [];
                    try { localStorage.setItem("cm-thread-replies-" + cmTid, JSON.stringify(all)); } catch (e2) {
                        alert("Storage full — could not save reply.");
                        return;
                    }
                    alert("Image too large for local test storage — posted as text only.");
                }
                cmClaimPost(rid);
                cmRenderAll();
                clearForm();
            });
        }
        if (!files.length) { done(); return; }
        var pending = files.length;
        files.forEach(function(f) {
            cmProcessImage(f).then(function(item) {
                if (!item) { if (--pending === 0) done(); return; }
                cmUploadToApi(item).then(function(url) {
                    imgs.push(url);
                    if (--pending === 0) done();
                }, function() {
                    imgs.push(item.local);
                    if (--pending === 0) done();
                });
            });
        });
    });
    var cmFiles = [];
    document.getElementById("cm-file-upload").addEventListener("change", function(e) {
        var box = document.getElementById("cm-images-container");
        Array.from(e.target.files).forEach(function(file) {
            cmFiles.push(file);
            var img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.title = "Click to remove";
            img.addEventListener("click", function() {
                cmFiles = cmFiles.filter(function(f) { return f !== file; });
                img.remove();
            });
            box.appendChild(img);
        });
        this.value = "";
    });
    var cmLB = document.createElement("div");
    cmLB.className = "lightbox";
    cmLB.innerHTML = '<button type="button" class="lb-close">×</button><img class="lb-img" alt="zoomed image">';
    document.body.appendChild(cmLB);
    cmLB.querySelector(".lb-close").addEventListener("click", function() { cmLB.classList.remove("open"); });
    cmLB.addEventListener("click", function(e) { if (e.target === cmLB) cmLB.classList.remove("open"); });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape") cmLB.classList.remove("open"); });
    document.querySelector(".cm-op-img img").addEventListener("click", function() {
        cmLB.querySelector(".lb-img").src = this.src;
        cmLB.classList.add("open");
    });
