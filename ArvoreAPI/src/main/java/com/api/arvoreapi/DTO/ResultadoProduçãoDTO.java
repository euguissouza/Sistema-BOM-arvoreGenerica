package com.api.arvoreapi.DTO;

import java.math.BigDecimal;
import java.util.List;

public class ResultadoProduçãoDTO {
    String produto;
    int quantidadeProduzida;
    List<ComponenteNecessarioDTO> componentes;
    BigDecimal valorTotal;

    public ResultadoProduçãoDTO(String nome, int quantidade, BigDecimal valorTotal, List<ComponenteNecessarioDTO> listaComponentes) {

        this.produto = nome;
        this.quantidadeProduzida = quantidade;
        this.valorTotal = valorTotal;
        this.componentes = listaComponentes;
    }
}
