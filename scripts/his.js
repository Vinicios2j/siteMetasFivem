
const token = localStorage.getItem("token");

let dataInicio = localStorage.getItem("dataInicioMeta");
let dataFim = localStorage.getItem("dataFimMeta");

if (!token) {
    window.location.href = "auth.html";
}

let meta = localStorage.getItem("metaTotal");

/* ================================
   DASHBOARD
================================ */

async function filtrarPorPeriodo() {

    const inicioInput = document.getElementById("dataInicioFiltro").value;
    const fimInput = document.getElementById("dataFimFiltro").value;

    if (!inicioInput || !fimInput) {
        alert("Selecione data inicial e final.");
        return;
    }

    const inicio = new Date(inicioInput);
    const fim = new Date(fimInput);
    fim.setHours(23,59,59,999); // pega o dia inteiro

    const response = await fetch("http://localhost:3000/api/registros", {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!response.ok) {
        logout();
        return;
    }

    const registros = await response.json();
    const lista = document.getElementById("listaRegistros");
    lista.innerHTML = "";

    const filtrados = registros.filter(r => {

        if (!r.data) return false;

        const dataRegistro = new Date(r.data);
        return dataRegistro >= inicio && dataRegistro <= fim;
    });

    if (!filtrados.length) {
        lista.innerHTML = "<p>Nenhum registro nesse período.</p>";
        return;
    }

    filtrados.sort((a,b) => new Date(b.data) - new Date(a.data));

    const titulo = document.createElement("h3");
    titulo.style.color = "#00ff88";
    titulo.innerText = `📅 ${inicio.toLocaleDateString("pt-BR")} até ${fim.toLocaleDateString("pt-BR")}`;
    lista.appendChild(titulo);

    filtrados.forEach(r => {

        const div = document.createElement("div");
        div.className = "registro";

        div.innerHTML = `
            <div>
                <strong>Nome:</strong> ${r.nome} |
                <strong>ID:</strong> ${r.id} |
                <strong>Qtd:</strong> ${r.quantidade} |
                <strong>Data:</strong> ${new Date(r.data).toLocaleDateString("pt-BR")}
            </div>
            ${r.imagem 
                ? `<button onclick="acessarFoto('${r.imagem}')">Foto</button>`
                : `<span style="color:gray">Sem Foto</span>`
            }
        `;

        lista.appendChild(div);
    });
}

function verRelatorio() {

    const dados = JSON.parse(localStorage.getItem("relatorioMeta"));

    if (!dados) {
        alert("Nenhuma meta finalizada ainda.");
        return;
    }

    document.getElementById("dashboardArea").style.display = "none";
    document.getElementById("historicoContainer").style.display = "none";

    const container = document.getElementById("relatorioContainer");
    container.style.display = "block";
    container.innerHTML = "";

    dados.forEach(meta => {

        const div = document.createElement("div");
        div.style.marginBottom = "25px";
        div.style.background = "#1a1a1a";
        div.style.padding = "15px";
        div.style.borderRadius = "10px";

        div.innerHTML = `
            <h3>${meta.meta}</h3>
            <p style="color:#00ff88;"><strong>✔ Conseguiram:</strong> 
            ${meta.conseguiu.length ? meta.conseguiu.join(", ") : "Ninguém"}</p>
            <p style="color:#ff4444;"><strong>❌ Não Conseguiram:</strong> 
            ${meta.naoConseguiu.length ? meta.naoConseguiu.join(", ") : "Ninguém"}</p>
        `;

        container.appendChild(div);
    });
}

function atualizarContador() {

    if (!dataFim) {
        document.getElementById("contadorMeta").innerText = "Meta não ativada";
        return;
    }

    setInterval(() => {

        const agora = new Date();
        const fim = new Date(localStorage.getItem("dataFimMeta"));

        const diferenca = fim - agora;

        if (diferenca <= 0) {
            verificarMetaExpirada();
            return;
        }

        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferenca / (1000 * 60)) % 60);
        const segundos = Math.floor((diferenca / 1000) % 60);

        document.getElementById("contadorMeta").innerText =
            `⏳ Meta termina em: ${dias}d ${horas}h ${minutos}m ${segundos}s`;

    }, 1000);
}

function verificarMetaExpirada() {

    if (!dataFim) return;

    const agora = new Date();
    const fim = new Date(dataFim);

    if (agora > fim) {

        gerarRelatorioFinal();

        localStorage.removeItem("dataInicioMeta");
        localStorage.removeItem("dataFimMeta");

        localStorage.setItem("metaEncerrada", "true");

        alert("Meta finalizada! Relatório salvo.");

        location.reload();
    }
}

function gerarRelatorioFinal() {

    const metas = [
        { nome: "Meta 1", valor: 700 },
        { nome: "Meta 2", valor: 1050 },
        { nome: "Meta 3", valor: 2050 }
    ];

    let relatorio = [];

    metas.forEach(meta => {

        let resultadoMeta = {
            meta: meta.nome,
            conseguiu: [],
            naoConseguiu: []
        };

        Object.keys(dadosUsuarios).forEach(nome => {

            if (dadosUsuarios[nome] >= meta.valor) {
                resultadoMeta.conseguiu.push(nome);
            } else {
                resultadoMeta.naoConseguiu.push(nome);
            }

        });

        relatorio.push(resultadoMeta);
    });

    localStorage.setItem("relatorioMeta", JSON.stringify(relatorio));

    dadosUsuarios = {};
}
let dadosUsuarios = {};

async function carregarDashboard() {

    const response = await fetch("http://localhost:3000/api/registros", {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!response.ok) {
        logout();
        return;
    }

    const registros = await response.json();

    dadosUsuarios = {};

    registros.forEach(r => {
        if (!dadosUsuarios[r.nome]) {
            dadosUsuarios[r.nome] = 0;
        }
        dadosUsuarios[r.nome] += Number(r.quantidade);
    });

    trocarMeta(700, document.querySelector(".metaTab"));
}

function trocarMeta(valorMeta, recompensa, elemento) {

    document.querySelectorAll(".metaTab").forEach(tab => {
        tab.classList.remove("active");
    });

    elemento.classList.add("active");

    const container = document.getElementById("metaContainer");
    container.innerHTML = "";

    const usuariosOrdenados = Object.keys(dadosUsuarios).sort();

    usuariosOrdenados.forEach(nome => {

        const total = dadosUsuarios[nome];
        const porcentagem = Math.min((total / valorMeta) * 100, 100).toFixed(1);

        const bateuMeta = total >= valorMeta;

        const card = document.createElement("div");
        card.className = "userCard";

        card.innerHTML = `
            <div class="userHeader">
                <span>${nome}</span>
                <span>${total} / ${valorMeta}</span>
            </div>
            <div class="progressBar">
                <div class="progressFill" style="width:${porcentagem}%"></div>
            </div>
            ${bateuMeta 
                ? `<div style="margin-top:8px;color:#00ff88;font-weight:bold;">
                     💰 Ganha: $${recompensa.toLocaleString()}
                   </div>`
                : `<div style="margin-top:8px;color:#888;font-size:12px;">
                     Falta ${valorMeta - total} para bater a meta
                   </div>`
            }
        `;

        container.appendChild(card);
    });
}

/* ================================
   META
================================ */

async function criarMetaPeriodo() {

    const dataInicio = document.getElementById("dataInicioMeta").value;
    const dataFim = document.getElementById("dataFimMeta").value;

    if (!dataInicio || !dataFim) {
        alert("Preencha data inicial e final.");
        return;
    }

    if (new Date(dataFim) <= new Date(dataInicio)) {
        alert("Data final precisa ser maior que a inicial.");
        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/criar-meta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                dataInicio,
                dataFim
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.erro || "Erro ao criar meta.");
            return;
        }

        alert("Meta criada com sucesso!");
        carregarMetaAtual();

    } catch (err) {
        alert("Erro ao conectar com servidor.");
    }
}

async function carregarMetaAtual() {

    const response = await fetch("http://localhost:3000/api/meta-atual");

    const meta = await response.json();

    if (!meta.ativa) {
        document.getElementById("contadorMeta").innerText =
            "⚠ Ainda não há metas criadas.";
        return;
    }

    iniciarContador(meta.dataFim);
}

function iniciarContador(dataFim) {

    setInterval(() => {

        const agora = new Date();
        const fim = new Date(dataFim);
        const diff = fim - agora;

        if (diff <= 0) {
            document.getElementById("contadorMeta").innerText =
                "⛔ Meta encerrada.";
            return;
        }

        const dias = Math.floor(diff / (1000*60*60*24));
        const horas = Math.floor((diff/(1000*60*60))%24);
        const minutos = Math.floor((diff/(1000*60))%60);
        const segundos = Math.floor((diff/1000)%60);

        document.getElementById("contadorMeta").innerText =
            `⏳ ${dias}d ${horas}h ${minutos}m ${segundos}s`;

    }, 1000);
}
function criarMeta() {

    const valor = prompt("Digite o valor total da meta:");

    if (!valor || isNaN(valor)) {
        alert("Digite um número válido.");
        return;
    }

    meta = parseInt(valor);
    localStorage.setItem("metaTotal", meta);

    atualizarMeta(document.getElementById("totalGeral").innerText);
}

function atualizarMeta(totalAtual) {

    const metaValor = document.getElementById("metaValor");
    const progressFill = document.getElementById("progressFill");

    if (!meta) {
        metaValor.innerText = "Não definida";
        progressFill.style.width = "0%";
        progressFill.innerText = "";
        return;
    }

    metaValor.innerText = meta;

    const porcentagem = Math.min((totalAtual / meta) * 100, 100);

    progressFill.style.width = porcentagem + "%";
    progressFill.innerText = porcentagem.toFixed(1) + "%";
}

/* ================================
   HISTÓRICO
================================ */
async function carregarHistorico() {

    const response = await fetch("http://localhost:3000/api/registros", {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!response.ok) {
        logout();
        return;
    }

    const registros = await response.json();
    const lista = document.getElementById("listaRegistros");
    lista.innerHTML = "";

    if (!registros.length) {
        lista.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
    }

    // Ordenar do mais recente para o mais antigo
    registros.sort((a, b) => new Date(b.data) - new Date(a.data));

    const grupos = {};

    registros.forEach(r => {

        if (!r.data) return;

        const dataRegistro = new Date(r.data);

        // Criar chave da semana (ano + número da semana)
        const inicioSemana = new Date(dataRegistro);
        inicioSemana.setDate(dataRegistro.getDate() - dataRegistro.getDay());

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);

        const chave = inicioSemana.toISOString().split("T")[0];

        if (!grupos[chave]) {
            grupos[chave] = {
                inicio: new Date(inicioSemana),
                fim: new Date(fimSemana),
                registros: []
            };
        }

        grupos[chave].registros.push(r);
    });

    const semanasOrdenadas = Object.values(grupos)
        .sort((a, b) => b.inicio - a.inicio);

    semanasOrdenadas.forEach(semana => {

        const bloco = document.createElement("div");
        bloco.style.marginBottom = "30px";
        bloco.style.background = "#141414";
        bloco.style.padding = "15px";
        bloco.style.borderRadius = "10px";

        const inicioFormatado = semana.inicio.toLocaleDateString("pt-BR");
        const fimFormatado = semana.fim.toLocaleDateString("pt-BR");

        bloco.innerHTML = `
            <h3 style="color:#00ff88;">
                📅 ${inicioFormatado} até ${fimFormatado}
            </h3>
        `;

        semana.registros.forEach(r => {

            const div = document.createElement("div");
            div.className = "registro";

            div.innerHTML = `
                <div>
                    <strong>Nome:</strong> ${r.nome} |
                    <strong>ID:</strong> ${r.id} |
                    <strong>Qtd:</strong> ${r.quantidade}
                </div>
                ${r.imagem 
                    ? `<button onclick="acessarFoto('${r.imagem}')">Foto</button>`
                    : `<span style="color:gray">Sem Foto</span>`
                }
            `;

            bloco.appendChild(div);
        });

        lista.appendChild(bloco);
    });
}

/* ================================
   BOTÕES
================================ */
function toggleHistorico() {

    const dash = document.getElementById("dashboardArea");
    const hist = document.getElementById("historicoContainer");

    if (hist.style.display === "none" || hist.style.display === "") {
        dash.style.display = "none";
        hist.style.display = "block";
        carregarHistorico();
    } else {
        hist.style.display = "none";
        dash.style.display = "block";
    }
}

function acessarFoto(caminho) {
    window.open("http://localhost:3000" + caminho, "_blank");
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "admin.html";
}

carregarMetaAtual();
carregarDashboard();
