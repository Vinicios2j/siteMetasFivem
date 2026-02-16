

document.getElementById("adminLoginBtn").addEventListener("click", function() {
    window.location.href = "admin.html";
});

document.getElementById("historyBtn").addEventListener("click", function() {
    document.getElementById("mainPanel").style.width = "800px";
});

document.getElementById("drugForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const id = document.getElementById("playerId").value.trim();
    const name = document.getElementById("playerName").value.trim();
    const type = document.getElementById("drugType").value;
    const quantity = document.getElementById("quantity").value.trim();
    const image = document.getElementById("imageUpload").files[0];

    // 🔴 VALIDAÇÃO FORTE
    if (!id || !name || !type || !quantity || !image) {
        alert("Preencha TODOS os campos antes de enviar!");
        return;
    }

    // 🔥 Criando FormData
    const formData = new FormData();
    formData.append("playerId", id);
    formData.append("playerName", name);
    formData.append("drugType", type);
    formData.append("quantity", quantity);
    formData.append("image", image);

    try {
        const response = await fetch("http://localhost:3000/api/drogas", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert("Registro enviado com sucesso!");
            document.getElementById("drugForm").reset();
        } else {
            alert("Erro ao enviar: " + result.message);
        }

    } catch (error) {
        console.error(error);
        alert("Erro ao conectar com a API!");
    }
});

const API = "http://localhost:3000/api";
let token = localStorage.getItem("token");

// Se já estiver logado
if (token) {
    mostrarPainel();
}

// -------------------------

function mostrarRegistro() {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("registerContainer").style.display = "block";
}

function mostrarLogin() {
    document.getElementById("registerContainer").style.display = "none";
    document.getElementById("loginContainer").style.display = "block";
}

// -------------------------

async function registrar() {

    const nome = document.getElementById("regNome").value;
    const gameId = document.getElementById("regGameId").value;
    const discordId = document.getElementById("regDiscordId").value;
    const senha = document.getElementById("regPassword").value;

    const response = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, gameId, discordId, senha })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message);
        return;
    }

    alert("Conta criada com sucesso!");
    mostrarLogin();
}

// -------------------------

async function login() {

    const gameId = document.getElementById("loginGameId").value;
    const senha = document.getElementById("loginPassword").value;

    const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, senha })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message);
        return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("tipo", "membro");

    mostrarPainel();
}

function mostrarPainel() {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("registerContainer").style.display = "none";
    document.getElementById("mainPanel").style.display = "block";

    carregarMeta();
}

function logout() {
    localStorage.removeItem("token");
    location.reload();
}

async function carregarMeta() {

    try {

        const response = await fetch("http://localhost:3000/api/meta-atual");
        const meta = await response.json();

        if (!meta || !meta.ativa) {
            document.getElementById("contadorMeta").innerText =
                "⚠ Ainda não há metas criadas.";
            return;
        }

        atualizarContador(meta.dataFim);

    } catch (err) {
        console.error(err);
        document.getElementById("contadorMeta").innerText =
            "Erro ao carregar meta.";
    }
}

async function atualizarDiasRestantesHistorico() {

    const response = await fetch("http://localhost:3000/api/meta-atual");
    const meta = await response.json();

    if (!meta || !meta.ativa) {
        const el = document.getElementById("diasRestantes");
        if (el) el.innerText = "0";
        return;
    }

    const fim = new Date(meta.dataFim);
    const agora = new Date();
    const diff = fim - agora;

    if (diff <= 0) {
        document.getElementById("diasRestantes").innerText = "0";
        return;
    }

    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

    document.getElementById("diasRestantes").innerText = dias;
}

const META1 = 700;
const META2 = 1050;
const META3 = 2050;

document.getElementById("historyBtn").addEventListener("click", carregarMeuHistorico);

async function carregarMeuHistorico() {

    const response = await fetch("http://localhost:3000/api/meus-registros", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const registros = await response.json();

    if (!response.ok) {
        alert("Erro ao carregar histórico.");
        return;
    }

    mostrarHistoricoMembro(registros);
}

async function carregarMeta() {

    const response = await fetch("http://localhost:3000/api/meta-atual");
    const meta = await response.json();

    if (!meta.ativa) {
        document.getElementById("contadorMeta").innerText =
            "Nenhuma meta ativa.";
        return;
    }

    atualizarContador(meta.dataFim);
}

function atualizarContador(dataFim) {

    setInterval(() => {

        const agora = new Date();
        const fim = new Date(dataFim);
        const diff = fim - agora;

        if (diff <= 0) {
            document.getElementById("contadorMeta").innerText =
                "Meta encerrada.";
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

function mostrarHistoricoMembro(registros) {

    const container = document.getElementById("mainPanel");

    let total = 0;
    registros.forEach(r => total += r.quantidade);

    function progresso(meta) {
        return Math.min((total / meta) * 100, 100);
    }

    function status(meta) {
        if (total >= meta) return "CONCLUÍDA ✅";
        return "Falta " + (meta - total);
    }

    container.innerHTML = `
        <div class="metaCard">

        <div class="contadorMeta">
            ⏳ Faltam <span id="diasRestantes"></span> dias para a meta encerrar
        </div>

            <button class="btnVoltar" onclick="location.reload()">⬅ Voltar</button>

            <h2>📊 Minhas Metas</h2>

            <div class="metaBox">
                <p>Meta 1 (${META1}) - ${status(META1)}</p>
                <div class="progressBar">
                    <div class="progress" style="width:${progresso(META1)}%"></div>
                </div>
            </div>

            <div class="metaBox">
                <p>Meta 2 (${META2}) - ${status(META2)}</p>
                <div class="progressBar">
                    <div class="progress" style="width:${progresso(META2)}%"></div>
                </div>
            </div>

            <div class="metaBox">
                <p>Meta 3 (${META3}) - ${status(META3)}</p>
                <div class="progressBar">
                    <div class="progress" style="width:${progresso(META3)}%"></div>
                </div>
            </div>

            <h3>Total Enviado: ${total}</h3>

            <hr>
            <div class="tabelaWrapper">
            <table class="tabelaMetas">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>ID</th>
                        <th>Quantidade</th>
                        <th>Foto</th>
                    </tr>
                </thead>
                <tbody>
                    ${registros.map(r => `
                        <tr>
                            <td>${r.nome}</td>
                            <td>${r.id}</td>
                            <td>${r.quantidade}</td>
                            <td>
                                <button class="btnFoto"
                                onclick="window.open('http://localhost:3000${r.imagem}')">
                                    Ver Foto
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            </div>

        </div>
    `;

    setTimeout(() => {
    atualizarDiasRestantesHistorico();
}, 100);
}