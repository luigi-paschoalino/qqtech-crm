function includeSetor() {
    var setor = document.getElementById("setor").value;
    console.log(setor);
    if (setor === "") {
        return;
    }
    setoresEnvolvidos.push(setor);
    console.log(setoresEnvolvidos);
    var list = document.querySelector("#setor");
    list.remove(list.selectedIndex);
}

setoresEnvolvidos = [];