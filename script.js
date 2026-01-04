// --- ESTADO DA APLICAÇÃO ---
let carrinho = []; // Array que guarda os kits
let isDelivery = false;
const MINIMO_MARMITAS = 10;



const CONFIG = {
        freteMinimo: 5.00,    // Valor fixo de saída (R$ 5,00)
        precoPorKm: 2.00,     // Quanto aumenta a cada Km (ex: R$ 2,00)
        telefoneZap: "5548984741168",
        origemLat: -28.481116, 
        origemLon: -48.780365  
    };  

    let valorFreteFinal = 0;
function calcularFrete() {
        const btn = document.getElementById('btnFrete');
        const kmInput = parseFloat(document.getElementById('inputKm').value);

        if (!kmInput || kmInput <= 0) {
            mostrarModal("Por favor, insira uma distância válida.", "📏");
            return;
        }

        btn.innerHTML = "⏳ Calculando...";

        // --- LÓGICA DO CÁLCULO ---
        // Valor Base (5,00) + (Km * Preço/Km)
        // Exemplo: 5.00 + (3km * 2.00) = R$ 11,00
        const calculo = CONFIG.freteMinimo + (kmInput * CONFIG.precoPorKm);
        
        // Arredonda para 2 casas decimais
        valorFreteFinal = parseFloat(calculo.toFixed(2));

        setTimeout(() => {
            // Atualiza o botão com o valor visualmente
            btn.innerHTML = `✅ Frete: R$ ${valorFreteFinal.toFixed(2).replace('.', ',')}`;
            btn.style.background = "#25D366"; // Verde Sucesso
            
            mostrarModal(`Frete calculado: <b>R$ ${valorFreteFinal.toFixed(2).replace('.', ',')}</b><br>(Base R$${CONFIG.freteMinimo} + R$${CONFIG.precoPorKm}/km)`, "🛵");
        }, 800);
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
    // 1. Validação (Mantém a mesma lógica de antes, só removendo o check de carbo/legume pois já tratamos no clique)
    const carbos = Array.from(document.querySelectorAll('input[name="carbo"]:checked')).map(el => el.value);
    // (Nota: A validação de quantidade aqui ainda é bom manter como segurança extra)
    if (carbos.length > 2) { mostrarModal("Máximo de 2 carboidratos.", "🍚"); return; }

    const protEl = document.querySelector('input[name="prot"]:checked');
    if (!protEl) { mostrarModal("Escolha 1 proteína.", "🥩"); return; }
    const proteina = protEl.value;

    const legumes = Array.from(document.querySelectorAll('input[name="legume"]:checked')).map(el => el.value);
    if (legumes.length > 3) { mostrarModal("Máximo de 3 legumes.", "🥦"); return; }

    const obs = document.getElementById('obsKit').value;

    // Cria Kit
    const novoKit = {
        id: Date.now(),
        carbos: carbos.length ? carbos.join(", ") : "Sem carbo",
        proteina: proteina,
        legumes: legumes.length ? legumes.join(", ") : "Sem legumes",
        obs: obs
    };

    carrinho.push(novoKit);
    renderizarCarrinho();
    
    // Limpa o formulário visualmente
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    document.getElementById('obsKit').value = "";

    // MUDANÇA AQUI:
    // Não rola mais a tela para baixo automaticamente.
    // Mostra apenas o sucesso.
    mostrarModal("Kit adicionado ao carrinho! <br>Clique em <b>'Fazer + 5 Marmitas'</b> para continuar montando.", "✅");
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
    // Faz scroll suave até a área do carrinho
    const cartContainer = document.querySelector('.cart-container');
    if (cartContainer) {
        window.scrollTo({ top: cartContainer.offsetTop - 100, behavior: 'smooth' });
    }
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
                    <div class="cart-item-desc"><b>Prot:</b> ${kit.proteina}</div>
                    <div class="cart-item-desc"><b>Carbo:</b> ${kit.carbos}</div>
                    <div class="cart-item-desc"><b>Leg:</b> ${kit.legumes}</div>
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
        const km = document.getElementById('inputKm').value;
        const btn = document.getElementById('btnFrete');
        
        if (end.length > 5 && km.length > 0) {
            btn.disabled = false;
            btn.style.background = "#C04A15";
            btn.style.color = "white";
            btn.style.cursor = "pointer";
        } else {
            btn.disabled = true;
            btn.style.background = "#7f8c8d";
            btn.style.color = "white";
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

    let mensagem = `*OLÁ, JO DELÍCIAS!* 😋\n`;
    mensagem += `Gostaria de fazer um pedido.\n\n`;
    mensagem += `👤 *Cliente:* ${nome}\n`;
    mensagem += `📅 *Data:* ${new Date().toLocaleDateString()}\n`;
    
    // Detalhes da Entrega
    if (isDelivery) {
            const endereco = document.getElementById('endereco').value;
            const horario = document.getElementById('horarioEntrega').value;
            const kmInfo = document.getElementById('inputKm').value;
            
            if (!endereco || !horario) {
                mostrarModal("Preencha endereço e horário.", "🛵");
                return;
            }
            
            if (valorFreteFinal === 0) {
                mostrarModal("Por favor, clique em <b>Calcular Valor</b> do frete antes de enviar.", "💰");
                return;
            }

            mensagem += `🛵 *Tipo:* ENTREGA\n`;
            mensagem += `📍 *Endereço:* ${endereco}\n`;
            mensagem += `📏 *Distância:* ${kmInfo}km\n`;
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
        mensagem += `🥩 ${kit.proteina}\n`;
        mensagem += `🍚 ${kit.carbos}\n`;
        mensagem += `🥦 ${kit.legumes}\n`;
        if (kit.obs) mensagem += `📝 Obs: ${kit.obs}\n`;
        mensagem += `\n`;
    });

    mensagem += `--------------------------\n`;
    mensagem += `Aguardo o valor total!`;

    const textoCodificado = encodeURIComponent(mensagem);
    const numero = "5548984741168"; 
    
    window.open(`https://wa.me/${numero}?text=${textoCodificado}`, '_blank');
}