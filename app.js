document.getElementById("filter").addEventListener("click", function(e) {
    document.addEventListener("click", function(e) {
        if (!e.target.closest("#filter") && !e.target.closest("#flist")) {
        document.getElementById("flist").style.display = "none";
    }
});
    e.preventDefault(); 
    const flist = document.getElementById("flist");
    flist.style.display = (flist.style.display === "block") ? "none" : "block";
});




document.getElementById("options").addEventListener("click", function(e) {
    document.addEventListener("click", function(e) {
        if (!e.target.closest("#options") && !e.target.closest("#olist")) {
        document.getElementById("olist").style.display = "none";
    }
});
    e.preventDefault(); 
    const flist = document.getElementById("olist");
    flist.style.display = (flist.style.display === "block") ? "none" : "block";
});

