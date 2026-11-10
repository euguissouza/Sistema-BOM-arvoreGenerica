package com.api.arvoreapi.Arvore;

import com.api.arvoreapi.Entity.Itens;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;


@Getter
public class NodeTree {

    private final Itens item;
    private final int quantidade;
    private  NodeTree pai;
    private List<NodeTree> filhos = new ArrayList<>();

    public NodeTree(Itens item, int quantidade) {
        this.item = item;
        this.quantidade = quantidade;
    }
    public boolean ehFolha() { return filhos.isEmpty(); }

    public void adicionarFilho(NodeTree filho) {
        filho.pai = this;
        filhos.add(filho);
    }


}
