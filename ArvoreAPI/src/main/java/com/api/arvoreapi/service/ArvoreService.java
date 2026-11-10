package com.api.arvoreapi.service;

import com.api.arvoreapi.Arvore.NodeTree;
import com.api.arvoreapi.DTO.*;
import com.api.arvoreapi.Entity.Itens;
import com.api.arvoreapi.Entity.ItensComposicao;
import com.api.arvoreapi.repository.ItensComposicaoRepository;
import com.api.arvoreapi.repository.ItensRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ArvoreService {

    private ItensRepository itensRepository;
    private ItensComposicaoRepository compRepo;


    public ArvoreService(ItensRepository itensRepository, ItensComposicaoRepository compRepo) {
        this.itensRepository = itensRepository;
        this.compRepo = compRepo;
    }




    public Itens salvaItem(ItemDTO dto){
        Itens item = new Itens();
        item.setNome(dto.getNome());
        item.setPreco(dto.getPreco());
        return  itensRepository.save(item);
    }


    public ItensComposicao adicionarComposicao(ComposicaoDTO dto){
        ItensComposicao composicao = new ItensComposicao();
        composicao.setFilho(dto.getFilho());
        composicao.setPai(dto.getPai());
        composicao.setQuant(dto.getQuant());

        return compRepo.save(composicao);
    }

    public Itens atualizaPreco(Integer id, BigDecimal novoPreco){
        Itens item = buscaItem(id);
        item.setPreco(novoPreco);
        return itensRepository.save(item);
    }

    private Itens buscaItem(Integer id) {
        return itensRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item não encontrado"));
    }

    public List<Itens> listarItens() {
        return itensRepository.findAll();
    }

    public List<ItensComposicao> listarComposicoes() {
        return compRepo.findAll();
    }


    public NodeTree montarArvore(Integer id) {
        return montarNo(buscaItem(id), 1);
    }


    private NodeTree montarNo(Itens item, int quantidade) {
        NodeTree no = new NodeTree(item, quantidade);
        for (ItensComposicao c  : compRepo.findByPai(item)) {
            no.adicionarFilho(montarNo(c.getFilho(), c.getQuant()));
        }
        return no;
    }

    public List<String> estrutura(Integer id) {
        List<String> linhas = new ArrayList<>();
        exibirConteudo(montarArvore(id), 0, linhas);
        return linhas;
    }

    private void exibirConteudo(NodeTree no, int nivel, List<String> linhas){
        linhas.add(" ".repeat(nivel) + no.getItem().getNome() + " (x" + no.getQuantidade() + ")");
        for (NodeTree filho : no.getFilhos()){
            exibirConteudo(filho, nivel + 1, linhas);
        }
    }


    private BigDecimal precoDe(Itens i){
        return i.getPreco() != null ? i.getPreco() : BigDecimal.ZERO;
    }

    public ResultadoProduçãoDTO producao(Integer id, int quantidade){
        NodeTree raiz = montarArvore(id);
        Map<Itens, Integer> totais = new LinkedHashMap<>();
        explosao(raiz, quantidade, totais);
        List<ComponenteNecessarioDTO> listaComponentes = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;
        for (Map.Entry<Itens,  Integer> e : totais.entrySet()){
            BigDecimal preco = precoDe(e.getKey());
            BigDecimal subtortal = preco.multiply(BigDecimal.valueOf(e.getValue()));
            listaComponentes.add(new ComponenteNecessarioDTO(e.getKey().getNome(), e.getValue(), preco, subtortal));
            valorTotal = valorTotal.add(subtortal);
        }

        return  new ResultadoProduçãoDTO(raiz.getItem().getNome(), quantidade, valorTotal, listaComponentes);

    }

    public void explosao(NodeTree no, int multiplicador, Map<Itens, Integer> totais){
        int quant = multiplicador * no.getQuantidade();
        if(no.ehFolha()){
            totais.merge(no.getItem(), quant, Integer::sum);
            return;
        }
        for(NodeTree filho : no.getFilhos()){
            explosao(filho, quant, totais);
        }
    }

    public BigDecimal custoProduto(Integer produtoId){
        return  custo(montarArvore(produtoId));
    }


    private BigDecimal custo(NodeTree no){
        if(no.ehFolha()) return precoDe(no.getItem());
        BigDecimal total  = BigDecimal.ZERO;
        for(NodeTree filho : no.getFilhos()){
            total = total.add(custo(filho).multiply(BigDecimal.valueOf(filho.getQuantidade())));
        }
        return total;
    }


    public List<Impacto> implosao(Integer componenteId){
        List<Impacto> impactos = new ArrayList<>();
        subir(buscaItem(componenteId), impactos);
        return impactos;
    }

    private void subir(Itens item, List<Impacto> impactos){
        for(ItensComposicao composicao : compRepo.findByFilho(item)){
            Itens pai = composicao.getPai();
            impactos.add(new Impacto(pai.getNome(),custo(montarNo(pai,1))));
            subir(pai, impactos);
        }
    }



}
