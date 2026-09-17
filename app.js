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
