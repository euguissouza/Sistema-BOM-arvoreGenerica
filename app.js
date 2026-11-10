
const API = 'http://localhost:8080/api';

const $ = id => document.getElementById(id);

const brl = n => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(n ?? 0);

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
}[c]));

const pick = (o, ...chaves) => {
    for (const k of chaves) {
        if (o && o[k] !== undefined) return o[k];
    }
    return undefined;
};

const numeroOuNulo = v => v === '' ? null : Number(v);


// ---------- MENSAGENS ----------

function aviso(texto, erro = false) {
    const m = $('mensagem');
    m.textContent = texto;
    m.style.color = erro ? '#b00020' : '#1b7f3b';
}


// ---------- REQUISIÇÕES HTTP ----------

async function req(caminho, opcoes = {}) {
    console.log(`[API] ${opcoes.method || 'GET'} ${API + caminho}`);

    const r = await fetch(API + caminho, {
        ...opcoes,
        method: opcoes.method || 'GET'
    });

    const texto = await r.text();

    if (!r.ok) {
        console.error('[API ERRO]', r.status, texto);
        throw new Error(texto || `Erro HTTP ${r.status}`);
    }

    if (!texto) return null;

    try {
        return JSON.parse(texto);
    } catch {
        throw new Error('A API retornou uma resposta que não é JSON válido.');
    }
}

const post = (caminho, corpo) => req(caminho, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(corpo)
});


// ---------- EXECUTAR COM TRATAMENTO DE ERROS ----------

async function executar(fn) {
    try {
        await fn();
    } catch (e) {
        console.error(e);
        aviso(e.message, true);
    }
}

function exigirSelecao(id, texto) {
    const v = $(id).value;

    if (!v) throw new Error(texto);

    return v;
}


// ---------- CARREGAR ITENS E COMPOSIÇÕES ----------

async function carregar() {
    const [itens, comps] = await Promise.all([
        req('/itens'),
        req('/composicoes')
    ]);

    if (!Array.isArray(itens)) {
        throw new Error('A API não retornou uma lista válida de itens.');
    }

    if (!Array.isArray(comps)) {
        throw new Error('A API não retornou uma lista válida de composições.');
    }

    const opcoes = '<option value="">Selecione</option>' +
        itens.map(i =>
            `<option value="${i.id}">${esc(i.nome)} (#${i.id})</option>`
        ).join('');

    [
        'item-pai',
        'produto-estrutura',
        'componente-atualizar'
    ].forEach(id => {
        const s = $(id);
        const atual = s.value;

        s.innerHTML = opcoes;
        s.value = atual;

        if (s.value !== atual) {
            s.value = '';
        }
    });

    // Renderizar componentes
    $('tabela-componentes').innerHTML = comps.map(c => {
        const filho = c.filho || {};
        const pai = c.pai || {};

        return `
            <tr>
                <td>${esc(filho.nome || 'Não informado')}</td>
                <td>${esc(pai.nome || 'Não informado')}</td>
                <td>${esc(c.quant ?? '-')}</td>
                <td>${filho.preco == null ? '—' : brl(filho.preco)}</td>
            </tr>
        `;
    }).join('') ||
        '<tr><td colspan="4">Nenhum componente cadastrado.</td></tr>';

    console.log('[API] Itens carregados:', itens);
    console.log('[API] Composições carregadas:', comps);
}


// ---------- 01 CADASTRAR PRODUTO ----------

$('btn-salvar-produto').onclick = () => executar(async () => {
    const nome = $('nome-produto').value.trim();
    const preco = numeroOuNulo($('valor-produto').value);

    if (!nome) {
        throw new Error('Informe o nome do produto.');
    }

    if (preco !== null && (!Number.isFinite(preco) || preco < 0)) {
        throw new Error('Informe um preço válido.');
    }

    const resultado = await post('/itens', {
        nome,
        preco
    });

    if (!resultado || !resultado.id) {
        throw new Error('O produto foi enviado, mas a API não retornou seu ID.');
    }

    $('form-produto').reset();

    aviso('Produto salvo com sucesso!');

    await carregar();
});


// ---------- 02 ADICIONAR COMPONENTE ----------

$('btn-add-componente').onclick = () => executar(async () => {

    const nome = $('nome-componente').value.trim();

    const pai = exigirSelecao(
        'item-pai',
        'Selecione o produto superior.'
    );

    const quant = Number($('quantidade-componente').value);

    const preco = numeroOuNulo(
        $('valor-componente').value
    );

    if (!nome) {
        throw new Error('Informe o nome do componente.');
    }

    if (!Number.isInteger(quant) || quant < 1) {
        throw new Error('A quantidade deve ser um número inteiro maior que zero.');
    }

    if (preco !== null && (!Number.isFinite(preco) || preco < 0)) {
        throw new Error('Informe um preço válido.');
    }

    // PRIMEIRO POST: cadastra o item filho
    console.log('[COMPONENTE] Cadastrando item...');

    const filho = await post('/itens', {
        nome,
        preco
    });

    if (!filho || !filho.id) {
        throw new Error('Não foi possível obter o ID do componente cadastrado.');
    }

    console.log('[COMPONENTE] Item cadastrado:', filho);

    // SEGUNDO POST: cria o relacionamento entre pai e filho
    const composicao = {
        pai: {
            id: Number(pai)
        },
        filho: {
            id: Number(filho.id)
        },
        quant: quant
    };

    console.log('[COMPONENTE] Enviando composição:', composicao);

    const resposta = await post('/composicoes', composicao);

    console.log('[COMPONENTE] Resposta da API:', resposta);

    $('form-componente').reset();

    aviso('Componente cadastrado e vinculado com sucesso!');

    await carregar();
});


// ---------- 03 EXPLOSÃO: ESTRUTURA ----------

function parseEstrutura(linhas) {
    if (!Array.isArray(linhas) || linhas.length === 0) {
        throw new Error('Nenhuma estrutura encontrada para este produto.');
    }

    const nos = linhas.map(l => {
        const texto = String(l);

        const m = texto.match(/^(\s*)(.*?)\s*\(x(\d+)\)\s*$/);

        return {
            ind: m ? m[1].length : 0,
            nome: m ? m[2].trim() : texto.trim(),
            qtd: m ? m[3] : '1',
            filhos: []
        };
    });

    const raiz = nos[0];
    const pilha = [raiz];

    for (const no of nos.slice(1)) {
        while (
            pilha.length > 1 &&
            pilha[pilha.length - 1].ind >= no.ind
        ) {
            pilha.pop();
        }

        pilha[pilha.length - 1].filhos.push(no);
        pilha.push(no);
    }

    return raiz;
}

function filhosHtml(no) {
    if (!no.filhos.length) return '';

    return '<ul>' + no.filhos.map(f => `
        <li>
            <div class="item-arvore">
                <span class="nome-item">${esc(f.nome)}</span>
                <span class="dados-item">Qtd.: ${f.qtd}</span>
            </div>
            ${filhosHtml(f)}
        </li>
    `).join('') + '</ul>';
}

$('btn-estrutura').onclick = () => executar(async () => {
    const id = exigirSelecao(
        'produto-estrutura',
        'Selecione um produto.'
    );

    const linhas = await req(`/produtos/${id}/estrutura`);

    const raiz = parseEstrutura(linhas);

    $('arvore-saida').innerHTML = `
        <div class="arvore-cabecalho">
            <div>
                <span class="rotulo-pequeno">PRODUTO PRINCIPAL</span>
                <h3>${esc(raiz.nome)}</h3>
            </div>
        </div>
        ${filhosHtml(raiz).replace('<ul>', '<ul class="arvore">')}
    `;

    aviso('Estrutura do produto carregada!');
});


// ---------- 04 ATUALIZAR COMPONENTE E IMPLOSÃO ----------

$('btn-atualizar').onclick = () => executar(async () => {
    const select = $('componente-atualizar');

    const id = exigirSelecao(
        'componente-atualizar',
        'Selecione um componente.'
    );

    const nomeComponente =
        select.options[select.selectedIndex].textContent;

    const valor = $('novo-valor').value;

    if (valor === '') {
        throw new Error('Informe o novo valor.');
    }

    const preco = Number(valor);

    if (!Number.isFinite(preco) || preco < 0) {
        throw new Error('Informe um preço válido.');
    }

    // 1. Atualiza o preço do componente
    await req(
        `/itens/${id}/preco?preco=${encodeURIComponent(preco)}`,
        { method: 'PUT' }
    );

    // 2. Busca os produtos afetados
    const impactos = await req(`/itens/${id}/implosao`);

    if (!Array.isArray(impactos)) {
        throw new Error('A API não retornou uma lista válida de impactos.');
    }

    console.log('[IMPLOSÃO] Produtos afetados:', impactos);

    // 3. Exibe a implosão no mesmo espaço usado pela explosão
    $('arvore-saida').innerHTML = `
        <div class="arvore-cabecalho">
            <div>
                <span class="rotulo-pequeno">IMPLOSÃO DA FÓRMULA</span>
                <h3>${esc(nomeComponente)}</h3>
                <p>Produtos que utilizam este componente</p>
            </div>
        </div>

        ${
            impactos.length
                ? `
                    <ul class="arvore">
                        ${impactos.map(i => `
                            <li>
                                <div class="item-arvore">
                                    <span class="nome-item">
                                        ${esc(pick(i, 'produto', 'nome'))}
                                    </span>
                                    <span class="dados-item">
                                        Novo custo:
                                        ${brl(pick(i, 'novoCusto', 'custo'))}
                                    </span>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                `
                : `
                    <div class="item-arvore">
                        Este componente não está vinculado a nenhum produto.
                    </div>
                `
        }
    `;

    // 4. Mantém também o resumo financeiro existente no HTML
    $('lista-implosao').innerHTML = impactos.map(i => `
        <li>
            ${esc(pick(i, 'produto', 'nome'))}:
            ${brl(pick(i, 'novoCusto', 'custo'))}
        </li>
    `).join('') ||
        '<li>Este item não é usado em nenhum produto.</li>';

    $('valor-atualizado').textContent = impactos.length
        ? brl(pick(impactos[impactos.length - 1], 'novoCusto', 'custo'))
        : 'R$ --';

    aviso('Componente atualizado e implosão calculada!');

    // Atualiza a tabela e os seletores sem apagar a árvore exibida
    await carregar();
});


// ---------- INICIALIZAÇÃO ----------

executar(carregar);
