// --- ESTADO DA APLICAÇÃO ---
let carrinho = []; // Array que guarda os kits
let isDelivery = false;
const MINIMO_MARMITAS = 10;

const CONFIG = {
    freteMinimo: 5.00,
    precoPorKm: 2.00,
    telefoneZap: "5548984741168",
    origemLat: -27.593967923301133, 
    origemLon: -48.61509918005286,
    
    pesos: {
        carbo:  { min: 60, max: 200, default: 100 },
        prot:   { min: 90, max: 170, default: 120 },
        legume: { min: 60, max: 100, default: 80 }
    }
};

    let valorFreteFinal = 0;
    let distanciaCalculada = 0;
async function calcularFrete() {
    const btn = document.getElementById('btnFrete');
    const enderecoInput = document.getElementById('endereco').value;
    
    // Adiciona a cidade/estado para melhorar a precisão da busca
    // Exemplo: Se Jo Delícias é de Laguna, forçamos a busca na região
    const enderecoCompleto = `${enderecoInput}, Santa Catarina, Brasil`;

    btn.innerHTML = "⏳ Buscando endereço...";
    btn.disabled = true;

    try {
        // 1. GEOCODING: Converte Endereço -> Coordenadas (Nominatim API)
        const responseGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&addressdetails=1&limit=1`);
        const dataGeo = await responseGeo.json();

        if (dataGeo.length === 0) {
            throw new Error("Endereço não encontrado. Tente ser mais específico (Rua, Número, Bairro).");
        }

        const destLat = dataGeo[0].lat;
        const destLon = dataGeo[0].lon;

        btn.innerHTML = "⏳ Calculando rota...";

        // 2. ROUTING: Calcula rota de carro (OSRM API)
        // Formato OSRM: longitude,latitude
        const urlRota = `https://router.project-osrm.org/route/v1/driving/${CONFIG.origemLon},${CONFIG.origemLat};${destLon},${destLat}?overview=false`;
        
        const responseRota = await fetch(urlRota);
        const dataRota = await responseRota.json();

        if (dataRota.code !== "Ok") {
            throw new Error("Não foi possível traçar uma rota até este local.");
        }

        // A API retorna distância em Metros, convertemos para Km
        const metros = dataRota.routes[0].distance;
        distanciaCalculada = (metros / 1000).toFixed(1); // Ex: 3.5

        // --- CÁLCULO FINANCEIRO ---
        const calculo = CONFIG.freteMinimo + (distanciaCalculada * CONFIG.precoPorKm);
        valorFreteFinal = parseFloat(calculo.toFixed(2));

        // SUCESSO
        btn.innerHTML = `✅ Frete: R$ ${valorFreteFinal.toFixed(2).replace('.', ',')} (${distanciaCalculada}km)`;
        btn.style.background = "#25D366";
        mostrarModal(`<b>Endereço localizado!</b><br>Distância: ${distanciaCalculada} km<br>Valor do Frete: R$ ${valorFreteFinal.toFixed(2).replace('.', ',')}`, "🛵");

    } catch (error) {
        console.error(error);
        mostrarModal(`Erro: ${error.message}<br>Verifique se escreveu o endereço corretamente.`, "❌");
        btn.innerHTML = "📍 Tentar Novamente";
        btn.style.background = "#C04A15";
        btn.disabled = false;
        valorFreteFinal = 0;
    }
}

function alterarPeso(tipo, delta) {
    const input = document.getElementById(`peso-${tipo}`);
    const limites = CONFIG.pesos[tipo];
    
    let novoValor = parseInt(input.value) + delta;
    
    // Garante que não ultrapasse os limites
    if (novoValor >= limites.min && novoValor <= limites.max) {
        input.value = novoValor;
    } else {
        // Feedback visual de erro (tremidinha ou cor vermelha rápida)
        input.style.color = 'red';
        setTimeout(() => input.style.color = 'var(--primary)', 200);
    }
}

function mostrarModal(mensagem, icone = '⚠️') {
    const modal = document.getElementById('customModal');
    document.getElementById('modalMessage').innerHTML = mensagem;
    document.getElementById('modalIcon').innerText = icone;
    modal.classList.add('active');
}
function fecharModal(event) {
    if (!event || event.target.id === 'customModal') {
        document.getElementById('customModal').classList.remove('active');
    }
}

// --- LÓGICA DO CARRINHO ---

function adicionarAoCarrinho() {
    // 1. Coleta Opções
    const carbos = Array.from(document.querySelectorAll('input[name="carbo"]:checked')).map(el => el.value);
    if (carbos.length > 2) { mostrarModal("Máximo de 2 carboidratos.", "🍚"); return; }

    const protEl = document.querySelector('input[name="prot"]:checked');
    if (!protEl) { mostrarModal("Escolha 1 proteína.", "🥩"); return; }
    const proteina = protEl.value;

    const legumes = Array.from(document.querySelectorAll('input[name="legume"]:checked')).map(el => el.value);
    if (legumes.length > 3) { mostrarModal("Máximo de 3 legumes.", "🥦"); return; }

    // 2. Coleta Pesos
    const pesoCarbo = document.getElementById('peso-carbo').value;
    const pesoProt = document.getElementById('peso-prot').value;
    const pesoLegume = document.getElementById('peso-legume').value;

    const obs = document.getElementById('obsKit').value;

    // Cria Kit com Pesos
    const novoKit = {
        id: Date.now(),
        carbos: carbos.length ? carbos.join(", ") : "Sem carbo",
        proteina: proteina,
        legumes: legumes.length ? legumes.join(", ") : "Sem legumes",
        pesos: { carbo: pesoCarbo, prot: pesoProt, legume: pesoLegume }, // Novo objeto de pesos
        obs: obs
    };

    carrinho.push(novoKit);
    renderizarCarrinho();
    limparSelecoes(); // Esta função agora deve resetar os pesos também

    mostrarModal("Kit adicionado! <br>Clique em <b>'Fazer + 5 Marmitas'</b> para continuar.", "✅");
}

function subirParaTopo() {
    // Rola suavemente até o cartão de montagem ou topo da página
    const areaMontagem = document.getElementById('clienteNome'); // Usa o input de nome como referência de topo
    if (areaMontagem) {
        areaMontagem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function limparSelecoes() {
    // Limpa checkboxes e radios
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    document.getElementById('obsKit').value = "";
    document.getElementById('peso-carbo').value = CONFIG.pesos.carbo.default;
    document.getElementById('peso-prot').value = CONFIG.pesos.prot.default;
    document.getElementById('peso-legume').value = CONFIG.pesos.legume.default;

    const cartContainer = document.querySelector('.cart-container');
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(kit => kit.id !== id);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const container = document.getElementById('lista-carrinho');
    const totalSpan = document.getElementById('totalMarmitas');
    const aviso = document.getElementById('avisoMinimo');
    const btnZap = document.getElementById('btnZap');
    
    container.innerHTML = ""; // Limpa visual

    if (carrinho.length === 0) {
        container.innerHTML = "Seu carrinho está vazio...";
        container.style.justifyContent = "center";
    } else {
        container.style.justifyContent = "flex-start";
        
        carrinho.forEach((kit, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-details">
                    <span class="cart-item-title">Kit #${index + 1} (5 unidades)</span>
                    <div class="cart-item-desc"><b>Prot (${kit.pesos.prot}g):</b> ${kit.proteina}</div>
                    <div class="cart-item-desc"><b>Carbo (${kit.pesos.carbo}g):</b> ${kit.carbos}</div>
                    <div class="cart-item-desc"><b>Leg (${kit.pesos.legume}g):</b> ${kit.legumes}</div>
                    ${kit.obs ? `<div class="cart-item-desc" style="color:#d35400">Obs: ${kit.obs}</div>` : ''}
                </div>
                <button class="btn-remove" onclick="removerDoCarrinho(${kit.id})">Remover</button>
            `;
            container.appendChild(itemDiv);
        });
    }

    const totalMarmitas = carrinho.length * 5;
    totalSpan.innerText = totalMarmitas;

    // Validação do botão final
    if (totalMarmitas >= MINIMO_MARMITAS) {
        aviso.style.display = 'none';
        btnZap.disabled = false;
    } else {
        aviso.style.display = 'block';
        btnZap.disabled = true;
    }
}

// --- LÓGICA DE ENTREGA ---

function setEntrega(status) {
    isDelivery = status;
    const fields = document.getElementById('deliveryFields');
    const optRet = document.getElementById('optRetirada');
    const optEnt = document.getElementById('optEntrega');

    if (isDelivery) {
        optEnt.classList.add('selected');
        optRet.classList.remove('selected');
        fields.classList.remove('hidden');
    } else {
        optRet.classList.add('selected');
        optEnt.classList.remove('selected');
        fields.classList.add('hidden');
    }
}

function checkAddress() {
    const end = document.getElementById('endereco').value;
    const btn = document.getElementById('btnFrete');
    
    if (end.length > 8) {
        btn.disabled = false;
        btn.style.background = "#C04A15";
        btn.style.cursor = "pointer";
    } else {
        btn.disabled = true;
        btn.style.background = "#7f8c8d";
        btn.style.cursor = "not-allowed";
    }
}

function resetarBotaoFrete() {
        const btn = document.getElementById('btnFrete');
        btn.innerHTML = "📍 Calcular Valor";
        btn.style.background = "#C04A15";
        valorFreteFinal = 0;
        checkAddress(); // Verifica se pode habilitar
    }

function verificarLimite(checkbox, limite, nomeItem) {
    // Conta quantos já estão marcados com esse nome
    const marcados = document.querySelectorAll(`input[name="${checkbox.name}"]:checked`);
    
    if (marcados.length > limite) {
        // Desmarca imediatamente o que o usuário acabou de clicar
        checkbox.checked = false;
        
        // Mostra o popout de aviso
        mostrarModal(`Ops! O limite é de <b>${limite} opções</b> de ${nomeItem}.<br>Desmarque uma opção antes de selecionar outra.`, '⚠️');
    }
}


function enviarPedidoFinal() {
    const nome = document.getElementById('clienteNome').value;
    
    if (!nome) {
        mostrarModal("Por favor, digite seu <b>nome completo</b> no topo da página.", "👤");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (isDelivery && valorFreteFinal === 0) { mostrarModal("Calcule o frete.", "📍"); return; }

    let mensagem = `*OLÁ, JO DELÍCIAS!* 😋\n`;
    mensagem += `Gostaria de fazer um pedido.\n\n`;
    mensagem += `👤 *Cliente:* ${nome}\n`;
    mensagem += `📅 *Data:* ${new Date().toLocaleDateString()}\n`;
    
    // Detalhes da Entrega
    if (isDelivery) {
            const endereco = document.getElementById('endereco').value;
            const horario = document.getElementById('horarioEntrega').value;
            
            // VALIDAÇÃO: Se não calculou o frete, bloqueia
            if (valorFreteFinal === 0) {
                mostrarModal("Por favor, clique no botão <b>Calcular Frete Automático</b> antes de finalizar.", "📍");
                return;
            }
            
            if (!horario) {
                mostrarModal("Escolha o <b>horário</b> de entrega.", "⏰");
                return;
            }

            mensagem += `🛵 *Tipo:* ENTREGA\n`;
            mensagem += `📍 *Endereço:* ${endereco}\n`;
            // Usa a variável global calculada pela API
            mensagem += `📏 *Distância:* ~${distanciaCalculada}km\n`; 
            mensagem += `💰 *Valor Frete:* R$ ${valorFreteFinal.toFixed(2).replace('.', ',')}\n`;
            mensagem += `⏰ *Horário:* ${horario}\n`;
        } else {
            mensagem += `👜 *Tipo:* RETIRADA NO LOCAL\n`;
        }
    
    mensagem += `\n📦 *RESUMO DO PEDIDO:*\n`;
    mensagem += `Total: ${carrinho.length * 5} marmitas\n`;
    mensagem += `--------------------------\n`;

    carrinho.forEach((kit, index) => {
        mensagem += `*KIT ${index + 1} (5 unidades):*\n`;
        mensagem += `🥩 Proteína (${kit.pesos.prot}g): ${kit.proteina}\n`;
        mensagem += `🍚 Carbo (${kit.pesos.carbo}g): ${kit.carbos}\n`;
        mensagem += `🥦 Legumes (${kit.pesos.legume}g): ${kit.legumes}\n`;
        if (kit.obs) mensagem += `📝 Obs: ${kit.obs}\n`;
        mensagem += `\n`;
    });

    mensagem += `--------------------------\n`;
    mensagem += `Aguardo o valor total!`;

    const textoCodificado = encodeURIComponent(mensagem);
    const numero = "5548984741168"; 
    
    window.open(`https://wa.me/${numero}?text=${textoCodificado}`, '_blank');
}